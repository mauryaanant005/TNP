import pandas as pd
import sys

try:
    df = pd.read_excel('TNP FAculty List.xlsx')
    print("Columns:", df.columns.tolist())
    print("First 5 rows:")
    print(df.head())
except Exception as e:
    print(f"Error reading file: {e}")
