import os
import json
import csv
import base64
import uuid
import logging
import traceback
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
import time
from urllib3 import response
from app.services.file_service import FileService
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.models.user import User
import pandas as pd
import requests
import websocket
import io


def _safe_repr(value: Any, maxlen: int = 200) -> str:
    try:
        text = repr(value)
    except Exception:
        return f"<unrepr {type(value).__name__}>"
    if len(text) > maxlen:
        return text[:maxlen] + "…"
    return text


_REDACT_KEYS = {"password", "api_key", "apikey", "token", "authorization", "secret"}


def _redact_mapping(m: Dict[str, Any]) -> Dict[str, Any]:
    redacted: Dict[str, Any] = {}
    for k, v in m.items():
        if isinstance(k, str) and k.lower() in _REDACT_KEYS:
            redacted[k] = "***"
        else:
            redacted[k] = v
    return redacted


def log_call(fn):
    """Decorator to log entry/exit, args, duration and exceptions for processing methods."""

    def wrapper(*args, **kwargs):
        # Resolve logger: prefer instance logger if first arg looks like self with .logger
        logger = None
        if args:
            maybe_self = args[0]
            logger = getattr(maybe_self, "logger", None)
        if logger is None:
            logger = logging.getLogger("processing")

        # Prepare a readable, redacted args/kwargs representation
        def arg_summaries(a_tuple: Tuple[Any, ...], kw: Dict[str, Any]) -> str:
            parts: List[str] = []
            for i, a in enumerate(a_tuple):
                if i == 0 and hasattr(a, fn.__name__):  # skip self in print
                    parts.append("self")
                else:
                    parts.append(_safe_repr(a))
            if kw:
                red_kw = _redact_mapping(kw)
                parts.append("kwargs=" + _safe_repr(red_kw))
            return ", ".join(parts)

        start = time.perf_counter()
        logger.info(f"CALL {fn.__name__}({arg_summaries(args, kwargs)})")
        try:
            result = fn(*args, **kwargs)
            elapsed_ms = int((time.perf_counter() - start) * 1000)
            # Summarize result without dumping huge payloads
            summary = None
            if isinstance(result, (str, bytes)):
                summary = f"{type(result).__name__}[len={len(result)}]"
            elif hasattr(result, "shape"):
                summary = (
                    f"{type(result).__name__}[shape={getattr(result, 'shape', None)}]"
                )
            elif isinstance(result, (list, tuple, dict)):
                summary = f"{type(result).__name__}[len={len(result)}]"
            else:
                summary = type(result).__name__
            logger.info(f"RETURN {fn.__name__} -> {summary} in {elapsed_ms} ms")
            return result
        except Exception:
            elapsed_ms = int((time.perf_counter() - start) * 1000)
            logger.exception(f"EXCEPTION in {fn.__name__} after {elapsed_ms} ms")
            raise

    return wrapper


class ProcessingService:
    """Refactored ETX batch utilities integrated with the project code style.
    All previous helpers in etxbatch.py are converted into instance methods.
    I/O is routed through the logger, and network calls use timeouts.
    """

    def __init__(self, logger: Optional[logging.Logger] = None) -> None:
        self.logger = logger or logging.getLogger("processing")
        if not self.logger.handlers:
            handler = logging.StreamHandler()
            handler.setFormatter(
                logging.Formatter(
                    "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
                )
            )
            self.logger.addHandler(handler)
        self.logger.setLevel(logging.INFO)

        # state used by some batch flows
        self.es_error_count = 0
        self.es_success_count = 0
        self.ess_df: Optional[pd.DataFrame] = None

    # ----------------------------- basic utilities -----------------------------
    @log_call
    def load_config(self) -> Dict[str, Any]:
        """Load configuration with robust fallbacks.
        Precedence:
        1) ETX_CONFIG_JSON (absolute path to JSON file)
        2) Remote API using ETX_API_BASE and ETX_BEARER_TOKEN -> /api/v1/users/me/config
        3) Local file app/core/etxbatch.json
        """

        # 1) Explicit file path override via env
        path_override = os.getenv("ETX_CONFIG_JSON")
        if path_override:
            try:
                with open(path_override) as f:
                    cfg = json.load(f)
                    if isinstance(cfg, dict):
                        self.logger.info(
                            f"Loaded config from ETX_CONFIG_JSON: {path_override}"
                        )
                        return cfg
            except Exception:
                self.logger.exception(
                    f"Failed to load ETX_CONFIG_JSON from {path_override}"
                )

        # 2) Remote API (requires bearer token)
        base_url = os.getenv("ETX_API_BASE") or "http://127.0.0.1:8000"
        token = os.getenv("ETX_BEARER_TOKEN")
        if token:
            try:
                url = base_url.rstrip("/") + "/api/v1/users/me/config"
                headers = {"Authorization": f"Bearer {token}"}
                resp = requests.get(url, headers=headers, timeout=15)
                if resp.status_code == 200:
                    data = resp.json() or {}
                    if isinstance(data, dict):
                        self.logger.info(f"Loaded config from remote API: {url}")
                        return data
                    else:
                        self.logger.info(
                            "Remote config did not return an object; ignoring"
                        )
                else:
                    self.logger.info(f"Remote config GET failed: {resp.status_code}")
            except Exception:
                self.logger.exception("Failed to load remote config")

        # 3) Local default file (project-checked-in config)
        config_path = os.path.join(os.path.dirname(__file__), "etxbatch.json")
        with open(config_path) as f:
            return json.load(f)

    @log_call
    def login(self, http_uri: str, email: str, password: str) -> Dict[str, Any]:
        url = f"{http_uri}/fid-auth"
        payload = {"login": {"email": email, "password": password}}
        resp = requests.post(url, json=payload, timeout=30)
        if resp.status_code != 200:
            raise RuntimeError("Failed to log in")
        return resp.json().get("login", {})

    @log_call
    def connect_websocket(self, ws_uri: str) -> websocket.WebSocket:
        ws = websocket.create_connection(ws_uri, timeout=30)
        return ws

    @log_call
    def wait_for_response(self, ws: websocket.WebSocket) -> Optional[Dict[str, Any]]:
        try:
            return json.loads(ws.recv())
        except Exception:
            self.logger.info("Cannot parse json from API response")
            traceback.print_exc()
            return None

    # ----------------------------- high level flows ----------------------------
    @log_call
    def ws_init(self, config: Dict[str, Any]) -> websocket.WebSocket:
        http_uri = config["HTTPURI"]
        ws_uri = config["WSURI"]
        email = config["email"]
        password = config["password"]

        login_payload = self.login(http_uri, email, password)
        fid = login_payload["fid"]

        ws_url = f"{ws_uri}/fid-{fid}"
        ws = self.connect_websocket(ws_url)

        # set org
        mid = str(uuid.uuid4())
        ws.send(self.build_set_org(mid=mid))
        _ = self.wait_for_response(ws)
        return ws

    @staticmethod
    @log_call
    def build_set_org(mid: Optional[str] = None) -> str:
        lines: List[str] = []
        lines.append("#")
        lines.append("$org = GetOrgs().Orgs.getFirst()")
        lines.append(f"$args.mid = '{mid}'")
        lines.append("$args.id = useof $org.owner defto $org.id")
        lines.append("$args.timeZone = 'Asia/Bangkok'")
        lines.append("SetOrg($args)\n")
        return "\n".join(lines)

    # ----------------------------- csv utilities ------------------------------
    @log_call
    def check_csv(self, file_name: str) -> List[List[str]]:
        if not os.path.isfile(file_name):
            raise FileNotFoundError(f"File not found: {file_name}")
        with open(file_name, newline="") as csvfile:
            reader = csv.reader(csvfile)
            rows = list(reader)
            if not rows:
                raise ValueError("CSV is empty")
            width = len(rows[0])
            if not all(len(r) == width for r in rows):
                raise ValueError("CSV format is incorrect: inconsistent columns")
            return rows

    @log_call
    def create_temp_folder(self) -> str:
        tmp = "etxtemp"
        os.makedirs(tmp, exist_ok=True)
        return tmp

    @log_call
    def split_csv(
        self, rows: List[List[str]], temp_folder: str, rows_per_file: int
    ) -> List[str]:
        file_names: List[str] = []
        header = rows[0]
        for i in range(1, len(rows), rows_per_file):
            chunk = rows[i : i + rows_per_file]
            out = os.path.join(temp_folder, f"chunk_{i // rows_per_file}.csv")
            with open(out, "w", newline="") as csvfile:
                writer = csv.writer(csvfile)
                writer.writerow(header)
                writer.writerows(chunk)
            file_names.append(out)
        return file_names

    # ------------------------------- http utils -------------------------------
    @log_call
    def ext_request(
        self,
        method: str,
        api_name: str,
        headers: Optional[Dict[str, str]] = None,
        data: Any = None,
    ) -> requests.Response:
        config = self.load_config()
        uri = config.get("HTTPURI", "")
        api_key = config.get("API_KEY", "")
        api_version = config.get("API_VERSION", "ctx/v1")
        url = f"{uri}/{api_version}/{api_name}"

        headers = headers.copy() if headers else {}
        headers.update({"DTX-DS-KEY": api_key})
        return requests.request(method, url, headers=headers, data=data, timeout=60)

    @log_call
    def get_all_es(self) -> pd.DataFrame:
        response = self.ext_request(method="GET", api_name="GetAllESs", data="")
        es_json = response.json()
        df = pd.DataFrame(es_json["GetAllESs"]["Results"]["EmissionSources"])
        self.logger.info(df)
        return df

    @log_call
    def publish_bar_data(
        self,
        es_id: str,
        bar_name: str,
        csv_data: str,
    ) -> bool:

        self.logger.info(
            f"Publishing BAR data for ES ID: {es_id} and Bar Name: {bar_name}"
        )

        payload = json.dumps(
            {"esId": es_id, "bartName": bar_name, "data": {"csv": csv_data}}
        )
        self.logger.info("--------------------------------")
        self.logger.info("Publishing BAR data")
        self.logger.info(f"Payload: {payload}")

        try:
            response = self.ext_request(
                method="POST", api_name="PublishBARData", data=payload
            )
            resp_json = response.json()
        except Exception:
            self.logger.error("PublishBARData returned non-JSON response")
            return False

        node = resp_json.get("PublishBARData") or {}
        status_code = node.get("statusCode")
        if status_code != 200:
            self.es_error_count += 1
            self.logger.info(f"Can't Publish: {es_id}")
            self.logger.info(f"Es error count: {self.es_error_count}")
            return False

        self.es_success_count += 1
        self.logger.info(f"Es success count: {self.es_success_count}")
        return True

    # ------------------------------ processing --------------------------------
    @log_call
    def process_csv_file(
        self,
        data_file: Optional[str] = None,
        file_path: Optional[str] = None,
        db: Session = None,
        user: User = None,
    ) -> None:

        self.logger.info(f"Processing file: {data_file} or {file_path}")

        if self.ess_df is None:
            raise RuntimeError("ESS dataframe not loaded")

        self.logger.info("ESS dataframe loaded")

        csv_data_df = None
        bar_name = None

        if data_file:
            file_service = FileService(db)
            file_obj = file_service.get_file_by_id(data_file, str(user.id))

            if not file_obj or file_obj.is_folder or file_obj.mime_type != "text/csv":
                raise RuntimeError("Invalid file")

            file_bytes = file_service.get_file_content(data_file, str(user.id))
            csv_string = file_bytes.decode("utf-8", errors="replace")
            csv_string = csv_string.replace("\r\n", "\n")
            csv_data_df = pd.read_csv(io.StringIO(csv_string))
            bar_name = file_obj.original_filename.split(".")[0].split("/")[-1]
            if not bar_name:
                bar_name = file_obj.original_filename.split(".")[0]
        else:
            csv_data_df = pd.read_csv(file_path)
            bar_name = os.path.splitext(os.path.basename(file_path))[0]

        if csv_data_df is None:
            raise RuntimeError("CSV data dataframe not loaded")

        # Process CSV data
        self.logger.info("--------------------------------")
        self.logger.info(f"CSV File Name: {bar_name}")
        self.logger.info(f"CSV String: {csv_string}")
        self.logger.info(f"CSV Data DataFrame: {csv_data_df}")

        es_column = "emissionSourceName"
        full_org_column = "orgFullName"
        full_es_column = "EsFullName"

        if (full_org_column in csv_data_df.columns) and (
            es_column in csv_data_df.columns
        ):
            csv_data_df[full_es_column] = (
                csv_data_df[full_org_column]
                + " : "
                + csv_data_df[es_column].astype(str)
            )
            grouped = csv_data_df.groupby([full_es_column])

            for _, group_df in grouped:
                es_fullname = (
                    group_df[full_es_column].iloc[0]
                    if full_es_column in group_df.columns
                    else ""
                )
                if full_es_column in group_df.columns:
                    cols_to_remove = [full_org_column, es_column, full_es_column]
                    group_df = group_df.drop(columns=cols_to_remove, errors="ignore")

                es_id = ""
                if es_fullname:
                    filtered_df = self.ess_df[
                        self.ess_df[full_es_column].str.contains(
                            es_fullname.replace(":", "/"), regex=False
                        )
                    ]
                    if not filtered_df.empty:
                        es_id = str(filtered_df["EsSID"].iloc[0])

                csv_payload = group_df.to_csv(index=False)
                if es_id and bar_name:
                    self.publish_bar_data(es_id, bar_name, csv_payload)
                else:
                    self.logger.error(
                        f"Can't Find Emission Source ID for: {es_fullname}"
                    )
        else:
            self.logger.info("File is invalid")

    @log_call
    def process_folder(self, data_folder: str) -> bool:
        for root, _dirs, files in os.walk(data_folder):
            for file in files:
                if file.endswith(".csv"):
                    self.process_csv_file(file_path=os.path.join(root, file))
        return True

    # ------------------------------- public APIs -------------------------------
    @log_call
    def ingestes(
        self,
        data_file: Optional[str] = None,
        offset: int = 0,
        nrows: int = 100000,
        db: Session = None,
        user: User = None,
        delOnComplete: bool = False,
        mid: Optional[str] = str(uuid.uuid4()),
    ) -> str:

        config = self.load_config()
        ws = self.ws_init(config)
        folder = config.get("ServerFileFolder", "")
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        file_service = FileService(db)
        file_bytes = file_service.get_file_content(data_file, str(user.id))
        file_name, file_extension = file_service.get_file_name_and_extension(
            data_file, str(user.id)
        )
        if not file_bytes or not file_name or not file_extension:
            ws.close()
            return "error"

        file_full_name = f"{file_name}_{timestamp}{file_extension}"

        try:
            base64_string = base64.b64encode(file_bytes).decode("utf-8")
        except Exception as e:
            traceback.print_exc()
            self.logger.error(f"An error occurred: {e}")
            ws.close()
            return "error"

        print("file_full_name: ", file_full_name)
        print("base64_string: ", base64_string)

        payload = json.dumps(
            {
                "UploadBase64Imp": {
                    "mid": mid,
                    "fileName": file_full_name,
                    "content": base64_string,
                }
            }
        )
        self.logger.info("Uploading base64 file")
        print("[ingestes] payload: ", payload)
        ws.send(payload)
        response1 = self.wait_for_response(ws) or {}
        status1 = response1.get("status", "error") or "error"
        print("[ingestes] response: ", response1)
        print("[ingestes] status: ", status1)

        try:
            uploaded_file_path = (
                response1.get("UploadBase64Imp", {}).get("Message", {}).get("FilePath")
            )
        except Exception:
            traceback.print_exc()
            self.logger.error("Cannot upload data file!")

        if not uploaded_file_path:
            ws.close()
            return "error"

        ingest_payload = json.dumps(
            {
                "PyRequest": {
                    "app": "etx_batch",
                    "value": {
                        "Input": {
                            "action": "es_data_importer",
                            "data_file_path": os.path.join(folder, uploaded_file_path),
                            "offset": offset,
                            "nrows": nrows,
                            "tracking": True,
                        }
                    },
                }
            }
        )

        print("[ingestes] ingest_payload: ", ingest_payload)
        ws.send(ingest_payload)
        response2 = self.wait_for_response(ws)
        status2 = response2.get("status", "error") or "error"
        print("[ingestes] status: ", status2)
        print("[ingestes] response: ", response2)

        ws.close()
        return "Successfully!"

    @log_call
    def ingestbar(
        self,
        data_file: Optional[str] = None,
        db: Session = None,
        user: User = None,
        delOnComplete: bool = False,
        mid: Optional[str] = str(uuid.uuid4()),
    ) -> str:

        file_service = FileService(db)
        data_folder = file_service.get_folder_path(data_file, str(user.id))
        if not data_folder:
            return "error file not found"
        self.logger.info(f"[ingestbar] input data_folder: {data_folder}")

        self.es_error_count = 0
        self.es_success_count = 0
        self.ess_df = self.get_all_es()

        start_time = datetime.now()
        self.logger.info(f"Start Time: {start_time}")

        # self.process_folder(data_folder=os.path.join(folder, data_folder or ""))

        self.logger.info(f"Checking files in folder: {data_folder} for user: {user.id}")

        files = file_service.get_user_files(
            user_id=str(user.id), folder_path=data_folder
        )
        # files = file_service.get_all_user_files(str(user.id))

        for file in files:
            if file.is_folder or file.mime_type != "text/csv":
                self.logger.info(
                    f"Skipping file: {file.original_filename} because it is a folder or not a CSV file"
                )
                continue

            self.logger.info("--------------------------------")
            self.logger.info(f"Processing file: {file.original_filename}")
            self.logger.info(f"File ID: {file.id}")
            self.logger.info(f"File Path: {file.file_path}")
            self.logger.info(f"File Size: {file.file_size}")
            self.logger.info(f"File MIME Type: {file.mime_type}")
            self.logger.info(f"File Folder Path: {file.folder_path}")
            self.logger.info(f"File Is Folder: {file.is_folder}")
            self.logger.info(f"File Parent ID: {file.parent_id}")
            self.logger.info(f"File Uploaded At: {file.uploaded_at}")
            self.logger.info(f"File Updated At: {file.updated_at}")

            self.process_csv_file(
                data_file=file.id, file_path=file.file_path, db=db, user=user
            )

        end_time = datetime.now()
        self.logger.info(f"End Time: {end_time}")
        return "Successfully!!"

    @log_call
    def addtenant(self, tenant_name: Optional[str] = None) -> str:
        config = self.load_config()
        ws = self.ws_init(config)
        payload = json.dumps(
            {"CreateTenantAccount": {"Name": tenant_name, "AutoCreateDatabase": True}}
        )

        self.logger.info(f"[addtenant] payload: {payload}")
        ws.send(payload)
        response = self.wait_for_response(ws)
        status = response.get("status", "error") or "error"
        self.logger.info(f"[addtenant] status: {status}")
        self.logger.info(f"[addtenant] response: {response}")

        ws.close()
        return "Successfully!"

    @log_call
    def createorg(
        self,
        data_file: Optional[str] = None,
        tenant_name: Optional[str] = None,
        db: Session = None,
        user: User = None,
        delOnComplete: bool = False,
        mid: Optional[str] = str(uuid.uuid4()),
    ) -> str:

        config = self.load_config()
        ws = self.ws_init(config)
        file_service = FileService(db)
        file_bytes = file_service.get_file_content(data_file, str(user.id))
        if not file_bytes:
            ws.close()
            return "error"
        csv_string = file_bytes.decode("utf-8", errors="replace")
        # Escape for embedding inside single-quoted payload: escape backslashes, single quotes, and newlines
        csv_string = csv_string.replace("\r\n", "\n")

        if tenant_name:
            payload = json.dumps({"GetOrgs": {"mid": mid}})
            self.logger.info(f"[createorg] payload: {payload}")
            ws.send(payload)
            resp = self.wait_for_response(ws) or {}
            dict_org = (resp.get("GetOrgs", {}) or {}).get("Orgs", {})
            org_id = ""
            for key, value in dict_org.items():
                if value.get("name") == tenant_name:
                    org_id = key
            setorg = json.dumps({"SetOrg": {"mid": mid, "id": org_id}})
            self.logger.info(f"[createorg] setorg: {setorg}")
            ws.send(setorg)
            _ = self.wait_for_response(ws)

        payload = json.dumps(
            {"CreateOrgStructureFromCsv": {"mid": mid, "data": csv_string}}
        )

        self.logger.info(f"[createorg] payload: {payload}")
        ws.send(payload)
        response = self.wait_for_response(ws)
        status = response.get("status", "error") or "error"
        self.logger.info(f"[createorg] status: {status}")
        self.logger.info(f"[createorg] response: {response}")

        ws.close()
        return "Successfully!"

    @log_call
    def updateversion(
        self, version: Optional[str] = None, mid: Optional[str] = str(uuid.uuid4())
    ) -> str:
        config = self.load_config()
        ws = self.ws_init(config)
        formatted_date = datetime.now().strftime("%d-%m-%Y")
        payload = json.dumps(
            {
                "SetVersion": {
                    "mid": mid,
                    "etxVersion": version,
                    "releaseDate": formatted_date,
                    "description": "dev server",
                }
            }
        )

        self.logger.info(f"[updateversion] payload: {payload}")
        ws.send(payload)
        response = self.wait_for_response(ws)
        status = response.get("status", "error") or "error"
        self.logger.info(f"[updateversion] status: {status}")
        self.logger.info(f"[updateversion] response: {response}")

        ws.close()
        return "Successfully!"

    @log_call
    def generateschemeorg(
        self,
        db: Session = None,
        user: User = None,
        mid: Optional[str] = str(uuid.uuid4()),
    ) -> str:
        config = self.load_config()
        ws = self.ws_init(config)
        payload = json.dumps(
            {
                "PyRequest": {
                    "app": "genie_scheme_coordinator_app",
                    "value": {
                        "Input": {
                            "mid": mid,
                            "action": "scheme_up_organization",
                        },
                    },
                }
            }
        )
        print("[generateschemeorg] payload: ", payload)
        ws.send(payload)
        response = self.wait_for_response(ws)
        status = response.get("status", "error") or "error"
        print("[generateschemeorg] status: ", status)
        print("[generateschemeorg] response: ", response)

        ws.close()
        return "Success!"


# Singleton-like instance for importers
processing_service = ProcessingService()
