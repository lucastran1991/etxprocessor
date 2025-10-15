import os
import json
import csv
import base64
import requests
import websocket
import argparse
import shutil
import sys
import uuid
import inspect
import traceback
import logging
import pandas as pd
from datetime import datetime
from datetime import date
import websocket

# Create a logger
logger = logging.getLogger("ETX Batch")
logger.setLevel(logging.DEBUG)  # Set the logging level

# Create handlers
file_handler = logging.FileHandler("extbatch.log")  # Log to a file
console_handler = logging.StreamHandler()  # Print to console

# Set level for each handler
file_handler.setLevel(logging.DEBUG)
console_handler.setLevel(logging.INFO)

# Create a formatter and set it for both handlers
formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
file_handler.setFormatter(formatter)
console_handler.setFormatter(formatter)

# Add handlers to the logger
logger.addHandler(file_handler)
logger.addHandler(console_handler)


def load_config():
    config_path = os.path.join(os.path.dirname(__file__), "etxbatch.json")
    with open(config_path) as f:
        return json.load(f)


def login(http_uri, email, password):
    url = f"{http_uri}/fid-auth"
    payload = {"login": {"email": email, "password": password}}
    response = requests.post(url, json=payload)
    if response.status_code != 200:
        raise Exception("Failed to log in.")
    return response.json()["login"]


def ws_init(config=None):
    http_uri = config["HTTPURI"]
    ws_uri = config["WSURI"]
    email = config["email"]
    password = config["password"]

    # Login
    resp = login(http_uri, email, password)
    fid = resp["fid"]

    # WS Connect
    ws_url = f"{ws_uri}/fid-{fid}"
    ws = connect_websocket(ws_url)
    print("WebSocket Connection OPENDED:", ws_url)

    # SetOrg
    ws.send(set_org(mid="m2"))
    resp = wait_for_response(ws)
    print("# SetOrg:", json.dumps(resp, indent=2))

    return ws


def set_org(mid=None):
    payload_lines = []
    payload_lines.append("#")
    payload_lines.append("$org = GetOrgs().Orgs.getFirst()")
    payload_lines.append(f"$args.mid = '{mid}'")
    payload_lines.append("$args.id = useof $org.owner defto $org.id")
    payload_lines.append("$args.timeZone = 'Asia/Bangkok'")
    payload_lines.append("SetOrg($args)\n")
    return "\n".join(payload_lines)


def check_csv(file_name):
    if not os.path.isfile(file_name):
        raise FileNotFoundError(f"File not found: {file_name}")

    with open(file_name, newline="") as csvfile:
        try:
            reader = csv.reader(csvfile)
            rows = list(reader)
            if not all(len(row) == len(rows[0]) for row in rows):
                raise ValueError("CSV format is incorrect.")
            return rows
        except Exception as e:
            raise ValueError(f"Error reading CSV file: {e}")


def create_temp_folder():
    temp_folder = "etxtemp"
    os.makedirs(temp_folder, exist_ok=True)
    return temp_folder


def split_csv(rows, temp_folder, rows_per_file):
    file_names = []
    header = rows[0]  # Get the header row
    for i in range(1, len(rows), rows_per_file):  # Start from 1 to skip header
        file_chunk = rows[i : i + rows_per_file]
        file_name = os.path.join(temp_folder, f"chunk_{i // rows_per_file}.csv")
        with open(file_name, "w", newline="") as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(header)  # Write the header to each chunk
            writer.writerows(file_chunk)
        file_names.append(file_name)  # Store the full path for later use
    return file_names


def upload_file(file_name):
    if not os.path.isfile("./upload_to_etx.sh"):
        raise FileNotFoundError("upload_to_etx.sh script not found.")

    os.system(f"./upload_to_etx.sh {file_name}")


def move_file_to_server_folder(file_name, server_folder):
    shutil.move(file_name, os.path.join(server_folder, os.path.basename(file_name)))


def connect_websocket(ws_uri):
    ws = websocket.create_connection(ws_uri)
    print("Connected to WebSocket.")
    return ws


def create_get_orgs_payload():
    return "#\n$org = GetOrgs().Orgs.getFirst()"


def create_import_payload(mid, file_names):
    payload_lines = []
    payload_lines.append("#")
    payload_lines.append("$org = GetOrgs().Orgs.getFirst()")
    payload_lines.append(f"$args.mid = '{mid}'")
    payload_lines.append("$args.id = useof $org.owner defto $org.id")
    payload_lines.append("$args.timeZone = 'Asia/Bangkok'")
    payload_lines.append("SetOrg($args)\n")
    for file_name in file_names:
        payload_lines.append("#")
        payload_lines.append(
            f'Async => ImportEmissionFromCsv(mid: "{mid}", fileName: "{os.path.basename(file_name)}");'
        )
    return "\n".join(payload_lines) + "\n"


def wait_for_response(ws):
    response = None

    try:
        response = json.loads(ws.recv())
    except:
        logger.info("Cannot parse json from API response")
        traceback.print_exc()
        return None

    return response


def ext_request(method=None, api_name=None, headers=None, data=None):
    config = load_config()
    uri = config.get("HTTPURI", "")
    api_key = config.get("API_KEY", "")
    api_version = config.get("API_VERSION", "ctx/v1")
    url = f"{uri}/{api_version}/{api_name}"

    if not headers:
        headers = {}

    headers.update({"DTX-DS-KEY": api_key})

    return requests.request(method, url, headers=headers, data=data)


def get_all_es():
    response = ext_request(method="GET", api_name="GetAllESs", data="")
    es_json = response.json()
    df = pd.DataFrame(es_json["GetAllESs"]["Results"]["EmissionSources"])
    logger.info(df)
    return df


def publish_bar_data(es_id, bar_name, csv_data):
    global es_error_count
    global es_success_count

    payload = json.dumps(
        {"esId": es_id, "bartName": bar_name, "data": {"csv": csv_data}}
    )
    logger.info(f"Payload: {payload}")
    response = ext_request(method="POST", api_name="PublishBARData", data=payload)
    # response_json = response.json()
    try:
        response_json = response.json()
    except ValueError:
        print("Response is not in JSON format")
        response_json = None

    logger.info(response_json["PublishBARData"])
    if "statusCode" in response_json["PublishBARData"]:
        logger.info(response_json["PublishBARData"]["statusCode"])
        if response_json["PublishBARData"]["statusCode"] != 200:
            es_error_count = es_error_count + 1
            logger.info(f"Can't Publish: {es_id}")
            logger.info(f"Es error count: {es_error_count}")
        else:
            es_success_count = es_success_count + 1
            logger.info(f"Es success count: {es_success_count}")
    else:
        es_error_count = es_error_count + 1
        logger.info(f"Can't Publish: {es_id}")
        logger.info(f"Es error count: {es_error_count}")

    return True


def process_csv_file(file_path):
    global ess_df

    # Read CSV file into a DataFrame
    csv_data_df = pd.read_csv(file_path)
    es_column = "emissionSourceName"
    full_org_column = "orgFullName"
    full_es_column = "EsFullName"

    bar_name = os.path.splitext(os.path.basename(file_path))[0]
    csv_data_grouped = pd.DataFrame()

    # Grouping by 'column1' and 'column2'
    if (full_org_column in csv_data_df.columns) and (es_column in csv_data_df.columns):
        # Method 1: Using the '+' operator
        csv_data_df[full_es_column] = (
            csv_data_df[full_org_column] + " : " + csv_data_df[es_column].astype(str)
        )
        csv_data_grouped = csv_data_df.groupby([full_es_column])

        logger.info("csv_data_grouped")
        logger.info(csv_data_grouped)

        # Looping through the groups
        for _, group_df in csv_data_grouped:
            es_fullname = ""
            es_id = ""

            # print("CSV Data Columns: ", group_df.columns)
            if full_es_column in group_df.columns:
                es_fullname = group_df[full_es_column].iloc[0]

                # Define columns to remove from CSV
                columns_to_remove = [
                    full_org_column,
                    es_column,
                    full_es_column,
                ]  # Add your column names here
                # Remove specific columns
                group_df.drop(columns=columns_to_remove, inplace=True)

            if es_fullname:
                filtered_df = ess_df[
                    ess_df[full_es_column].str.contains(
                        es_fullname.replace(":", "/"), regex=False
                    )
                ]
                logger.info("Filtered DF:")
                logger.info(filtered_df)
                if not filtered_df.empty:
                    es_id = filtered_df["EsSID"].iloc[0]

            logger.info(f"BarName: {bar_name}")
            logger.info(f"ES FullName: {es_fullname}")
            logger.info(f"ES ID: {es_id}")

            # Convert DataFrame back to CSV string
            csv_data = group_df.to_csv(index=False)

            # Call HTTP API to send CSV data
            if es_id and bar_name:
                response = publish_bar_data(es_id, bar_name, csv_data)
                logger.info(response)
            else:
                logger.error(f"Can't Find Emission Source ID for: {es_fullname}")
    else:
        logger.info("File is invalid")


def process_folder(dataFolder=None):
    # Loop through folder and nested folders
    for root, dirs, files in os.walk(dataFolder):
        for file in files:
            if file.endswith(".csv"):
                file_path = os.path.join(root, file)
                logger.info(f"File Path: {file_path}")
                process_csv_file(file_path)

    return True


def ingestes(dataFile=None, offset=0, nrows=100000):
    # print(locals())
    config = load_config()
    ws = ws_init(config)
    folder = config.get("ServerFileFolder", "")
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    file_name, file_extension = os.path.splitext(
        os.path.basename(dataFile)
    )  # Split name and extension
    file_name = f"{file_name}_{timestamp}{file_extension}"  # Create new file name

    #
    try:
        # Open the CSV file and the output text file
        with open(dataFile, "rb") as csv_file:
            # Read the file content
            csv_content = csv_file.read()

            # Encode the content to Base64
            base64_bytes = base64.b64encode(csv_content)

            # Convert Base64 bytes back to a string
            base64_string = base64_bytes.decode("utf-8")

        print("Base64 Encoded CSV Content:")
        print(base64_string)

    except Exception as e:
        traceback.print_exc()
        logger.error(f"An error occurred: {e}")

    # Upload Base64
    mid = uuid.uuid4()
    payload = json.dumps(
        {
            "UploadBase64Imp": {
                "mid": str(mid),
                "fileName": file_name,
                "content": base64_string,
            }
        }
    )

    logger.info(payload)

    ws.send(payload)
    resp = wait_for_response(ws)
    try:
        logger.info(f"Upload CSV: {json.dumps(resp, indent=2)}")
        dataFile = resp.get("UploadBase64Imp", {}).get("Message", {}).get("FilePath")
    except:
        traceback.print_exc()
        logger.error("Cannot upload data file!")

    if not dataFile:
        return "Failed!!"

    # Ingest ES
    payload = f"""#
PyRequest:
    app: etx_batch
    value:
        Input:
            action: es_data_importer
            data_file_path: \"{os.path.join(folder, dataFile)}\"
            offset: {offset}
            nrows: {nrows}
            tracking: true"""

    logger.info(payload)

    ws.send(payload)
    resp = wait_for_response(ws)
    logger.info(f"Ingest ES: {json.dumps(resp, indent=2)}")

    # WS Close
    ws.close()
    logger.info("WebSocket Connection CLOSED!!")
    return "Successfully!!"


def ingestbar(dataFolder=None):
    # print(locals())
    global es_error_count
    global es_success_count
    global ess_df

    config = load_config()
    folder = config.get("ServerFileFolder", "")
    es_error_count = 0
    es_success_count = 0

    ess_df = get_all_es()

    start_time = datetime.now()
    logger.info(f"Start Time: {start_time}")

    process_folder(dataFolder=os.path.join(folder, dataFolder))

    end_time = datetime.now()
    logger.info(f"End Time: {end_time}")

    return "Successfully!!"


def ingestops(dataFile=None):
    print(locals())
    config = load_config()
    ws = ws_init(config)

    # WS Close
    ws.close()
    logger.info("WebSocket Connection CLOSED!!")
    return "Successfully!!"


def ingestesbyibot(dataFile=None):
    # print(locals())
    global es_error_count
    global es_success_count

    config = load_config()
    folder = config.get("ServerFileFolder", "")
    es_error_count = 0
    es_success_count = 0

    start_time = datetime.now()
    logger.info(f"Start Time: {start_time}")

    create_es_using_ibot(dataFile=os.path.join(folder, dataFile))

    end_time = datetime.now()
    logger.info(f"End Time: {end_time}")

    return "Successfully!!"


def create_es_using_ibot(dataFile=None):
    global es_error_count
    global es_success_count

    df = pd.read_csv(dataFile)

    # Initialize an empty dictionary
    data_dict = {}

    # Iterate through the DataFrame rows
    for index, row in df.iterrows():
        # Define the key as a tuple of 4 columns
        print(row)
        key = (row["orgFullName"], row["iBotName"], row["ibotCatalogName"], row["SIT"])

        # If the key already exists in the dictionary, append the emissionSource
        if key in data_dict:
            data_dict[key].append({"name": row["emissionSource"].strip()})
        else:
            # Otherwise, create a new entry with the emissionSource as a list
            data_dict[key] = [{"name": row["emissionSource"].strip()}]
    for key, value in data_dict.items():
        payload = json.dumps(
            {
                "iBotCatalogName": key[
                    2
                ].strip(),  # Get the iBotCatalogName that was created from UI
                "iBotName": key[1].strip(),  # Get the iBotName that was created from UI
                "SIT": "Month",
                "orgName": key[
                    0
                ].strip(),  # orgName can be orgRootName or child level org
                "EmissionSources": value,  # Pass the emission_sources list
            }
        )
        logger.info(f"Payload: {payload}")
        response = ext_request(
            method="POST", api_name="CreateESUsingIBot", data=payload
        )
        response_json = response.json()
        logger.info(response_json["CreateESUsingIBot"])
        if "statusCode" in response_json["CreateESUsingIBot"]:
            logger.info(response_json["CreateESUsingIBot"]["statusCode"])
            if response_json["CreateESUsingIBot"]["statusCode"] != 200:
                es_error_count = es_error_count + len(value)
                logger.info(f"Can't create es: {key[0]} + {value}")
                logger.info(f"Es error count: {es_error_count}")
            else:
                es_success_count = es_success_count + len(value)
                logger.info(f"Es success count: {es_success_count}")
        else:
            es_error_count = es_error_count + len(value)
            logger.info(f"Can't Publish:  {key[0]} + {value}")
            logger.info(f"Es error count: {es_error_count}")
    return True


def addtenant(tenantName=None):
    # print(locals())
    config = load_config()
    ws = ws_init(config)
    folder = config.get("ServerFileFolder", "")
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    mid = uuid.uuid4()
    args_2 = {"mid": "m1", "name": tenantName}
    payload = f"""#
CreateTenantAccount:
    Name: "{args_2['name']}"
    AutoCreateDatabase: True
    """
    logger.info(payload)

    ws.send(payload)
    resp = wait_for_response(ws)
    logger.info(f"Add tenant: {json.dumps(resp, indent=2)}")

    # WS Close
    ws.close()
    logger.info("WebSocket Connection CLOSED!!")
    return "Successfully!!"


def createorg(dataFile=None, tenantName=None):
    config = load_config()
    ws = ws_init(config)
    folder = config.get("ServerFileFolder", "")
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    mid = uuid.uuid4()

    getorg = f"""#
GetOrgs:
    mid: '1360bce9-30ce-4c86-9749-92faa7f7114f'"""

    ws.send(getorg)
    resp = wait_for_response(ws)
    logger.info(f"get org: {json.dumps(resp, indent=2)}")
    dict_org = resp.get("GetOrgs", {}).get("Orgs", {})
    logger.info(f"org-list: {dict_org}")
    org_id = ""
    for key, value in dict_org.items():
        if value.get("name") == tenantName:
            org_id = key
    logger.info(f"org_id: {org_id}")
    mid = uuid.uuid4()
    df = pd.read_csv(dataFile)
    csv_string = df.to_csv(index=False)
    setorg = f"""#
$org = GetOrgs().Orgs.getFirst()
$args.mid = 'm1'
$args.id = '{org_id}' # Org Id of Tenant
SetOrg($args)
    """
    ws.send(setorg)
    resp = wait_for_response(ws)
    payload = f"""#
Async => CreateOrgStructureFromCsv(mid: "{mid}", data: '{csv_string}')"""
    logger.info(payload)

    ws.send(payload)
    resp = wait_for_response(ws)
    logger.info(f"load org: {json.dumps(resp, indent=2)}")
    # WS Close
    ws.close()
    logger.info("WebSocket Connection CLOSED!!")
    return "Successfully!!"


def main(command, file_name):
    config = load_config()
    http_uri = config["HTTPURI"]
    ws_uri = config["WSURI"]
    email = config["email"]
    password = config["password"]
    server_folder = config["ServerFileFolder"]
    rows_per_file = config["RowsPerFile"]
    import_file_per_request = config["ImportFilePerRequest"]
    max_requests = config["MaxRequests"]

    login_response = login(http_uri, email, password)
    fid = login_response["fid"]

    ws_url = f"{ws_uri}/fid-{fid}"
    print(f"WebSocket URL: {ws_url}")

    rows = check_csv(file_name)
    print(f"CSV file '{file_name}' is valid. Number of rows: {len(rows)}")

    temp_folder = create_temp_folder()
    file_names = split_csv(rows, temp_folder, rows_per_file)

    if not file_names:
        print("Internal error occurred: No files created in etxtemp folder.")
        sys.exit(1)

    for f in file_names:
        if "localhost" not in http_uri and "ctxdev.atomiton.com" not in http_uri:
            upload_file(f)
        else:
            move_file_to_server_folder(f, server_folder)

    ws = connect_websocket(ws_url)

    # Send GetOrgs payload
    # get_orgs_payload = create_get_orgs_payload()
    # print("\nSending GetOrgs payload to WebSocket:\n")
    # print(get_orgs_payload)

    # ws.send(get_orgs_payload)

    # Wait for responses
    requests_sent = 0
    for i in range(0, len(file_names), import_file_per_request):
        batch_files = file_names[i : i + import_file_per_request]
        mid = str(uuid.uuid4())  # Generate a unique mid for this batch

        import_payload = create_import_payload(mid, batch_files)
        print("\nSending Import payload to WebSocket:\n")
        print(import_payload)

        ws.send(import_payload)

        # Process responses until we have received responses for all imports in the batch
        responses_to_wait = len(batch_files) + 1  # +1 for GetOrgs response
        while responses_to_wait > 0:
            import_response = wait_for_response(ws)
            print(f"Received Response: {json.dumps(import_response, indent=2)}")

            if "GetOrgs" in import_response:
                # Process GetOrgs response
                print("Processing GetOrgs response...")
                responses_to_wait -= 1  # Decrement for the GetOrgs response

            if "ImportEmissionFromCsv" in import_response:
                # Check for matching mid value
                if import_response["ImportEmissionFromCsv"]["mid"] == mid:
                    # Process ImportEmissionFromCsv response
                    status = import_response["ImportEmissionFromCsv"]
                    # Safely access fileName with .get() to avoid KeyError
                    file_name = os.path.basename(
                        batch_files[
                            batch_files.index(
                                import_response["ImportEmissionFromCsv"]["fileName"]
                            )
                        ]
                    )
                    print(
                        f"Filename: {file_name}, RowsCount: {status['Message']['RowsCount']}, SuccessRowsCount: {status['Message']['SuccessRowsCount']}"
                    )
                    responses_to_wait -= 1  # Decrement for each import response

        requests_sent += 1
        if max_requests != -1 and requests_sent >= max_requests:
            print("Reached maximum number of requests. Exiting.")
            break

    ws.close()


def updateversion(version=None):
    # print(locals())
    config = load_config()
    ws = ws_init(config)
    folder = config.get("ServerFileFolder", "")
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    mid = uuid.uuid4()
    # Get the current date
    current_date = datetime.now()

    # Format the date as DD-MM-YYYY
    formatted_date = current_date.strftime("%d-%m-%Y")
    etxVersion = version
    payload = f"""    #
    SetVersion:
        mid: "m2"
        etxVersion: {etxVersion}
        releaseDate: {formatted_date}
        description: "dev server"
    """
    logger.info(payload)

    ws.send(payload)
    resp = wait_for_response(ws)
    logger.info(f"update version: {json.dumps(resp, indent=2)}")

    # WS Close
    ws.close()
    logger.info("WebSocket Connection CLOSED!!")
    return "Successfully!!"


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Process CSV files.")
    parser.add_argument(
        "command",
        choices=[
            "updateversion",
            "createorg",
            "addtenant",
            "ingestesbyibot",
            "ingestes",
            "ingestbar",
            "ingestops",
        ],
        help="Command to execute",
    )
    parser.add_argument("--dataFile", help="Full path of the CSV file to consume")
    parser.add_argument("--dataFolder", help="Folder path of the CSV files to consume")
    parser.add_argument("--tenantName", help="The name of tenant to create")
    parser.add_argument("--version", help="The version to update")
    args = parser.parse_args()

    # main(args.command, args.dataFile)

    func_name = args.command
    func = globals().get(func_name)

    if callable(func):
        kwargs = {}
        keys = inspect.getfullargspec(func).args
        for arg in keys:
            v = getattr(args, arg, None)
            if arg != "self" and v is not None:
                kwargs[arg] = v

            resp = func(**kwargs)

            if isinstance(resp, dict):
                print(json.dumps(resp, indent=2))
            else:
                print(resp)
        else:
            print(resp)

    else:
        print(f"No function named [{func_name}] found.")
