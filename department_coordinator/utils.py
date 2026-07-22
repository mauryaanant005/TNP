import pandas as pd
import numpy as np

ALLOWED_EXTENSIONS = {"csv", "xlsx", "xls"}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def validate_file(file):
    if not file:
        return False
    filename = file.name
    file_extension = filename.rsplit(".", 1)[1].lower()
    return True if file_extension in ALLOWED_EXTENSIONS else False


def importExcelAndReturnJSON(file):
    filename = file.name
    file_extension = filename.rsplit(".", 1)[1].lower()
    
    if file_extension == "csv":
        df = pd.read_csv(file)
    else:
        df = pd.read_excel(file)
        
    df = df.replace({np.nan: None})
    ld = len(df)
    require_data = []
    for i in range(ld):
        row_dict = df.iloc[i].to_dict()
        clean_dict = {str(k).strip().lower(): v for k, v in row_dict.items()}
        require_data.append(clean_dict)
    return require_data
