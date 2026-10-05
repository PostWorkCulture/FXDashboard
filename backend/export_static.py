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
                
    print("Raw static trades exported to frontend/public/data/")

if __name__ == "__main__":
    main()
