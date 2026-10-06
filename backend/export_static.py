import json
import sqlite3
import os

def get_db_connection():
    db_path = os.path.join(os.path.dirname(__file__), "trades.db")
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def export_data(trade_type):
    conn = get_db_connection()
    # Export ALL trades for the given type, so the frontend can do dynamic filtering and math
    trades_list_query = conn.execute(
        "SELECT * FROM trades WHERE trade_type = ? ORDER BY exit_time ASC", 
        (trade_type,)
    ).fetchall()
    
    trades_list = [dict(t) for t in trades_list_query]
    conn.close()
    
    return {
        "raw_trades": trades_list
    }

def export_ohlcv():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    dashboard_dir = os.path.dirname(script_dir)
    project_dir = os.path.dirname(dashboard_dir)
    
    import pandas as pd
    
    pairs = ["EURUSD", "GBPUSD", "AUDUSD"]
    ohlcv_all = {}
    
    for pair in pairs:
        data_path = os.path.join(project_dir, "data", f"{pair}_H1.csv")
        if not os.path.exists(data_path):
            ohlcv_all[pair] = []
            continue
            
        df = pd.read_csv(data_path, index_col='time', parse_dates=True)
        df = df.loc['2023-01-01':]
        
        ohlcv = []
        for timestamp, row in df.iterrows():
            unix_time = int(timestamp.timestamp())
            ohlcv.append({
                "time": unix_time,
                "open": round(row['open'], 5),
                "high": round(row['high'], 5),
                "low": round(row['low'], 5),
                "close": round(row['close'], 5)
            })
        ohlcv_all[pair] = ohlcv
        
    return ohlcv_all

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    public_dir = os.path.join(os.path.dirname(script_dir), "frontend", "public", "data")
    os.makedirs(public_dir, exist_ok=True)
    
    for trade_type in ["backtest", "live"]:
        data = export_data(trade_type)
        for endpoint, payload in data.items():
            file_path = os.path.join(public_dir, f"{endpoint}-{trade_type}.json")
            with open(file_path, "w") as f:
                json.dump(payload, f)
                
    # Export OHLCV
    ohlcv_data = export_ohlcv()
    for pair, data in ohlcv_data.items():
        with open(os.path.join(public_dir, f"{pair.lower()}_h1_candles.json"), "w") as f:
            json.dump(data, f)
                
    print("Raw static trades and OHLCV exported to frontend/public/data/")

if __name__ == "__main__":
    main()
