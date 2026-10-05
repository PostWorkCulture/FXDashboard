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
    trades = conn.execute("SELECT * FROM trades WHERE trade_type = ?", (trade_type,)).fetchall()
    
    # Metrics
    total_trades = len(trades)
    winning_trades = sum(1 for t in trades if t["is_win"])
    win_rate = (winning_trades / total_trades) * 100 if total_trades > 0 else 0
    total_pnl = sum(t["pnl"] for t in trades)
    
    gross_profit = sum(t["pnl"] for t in trades if t["pnl"] > 0)
    gross_loss = abs(sum(t["pnl"] for t in trades if t["pnl"] < 0))
    profit_factor = gross_profit / gross_loss if gross_loss > 0 else 0
    
    metrics = {
        "total_trades": total_trades,
        "win_rate": round(win_rate, 2),
        "total_pnl": round(total_pnl, 2),
        "profit_factor": round(profit_factor, 2)
    }
    
    # Trades list
    trades_list_query = conn.execute(
        "SELECT * FROM trades WHERE trade_type = ? ORDER BY exit_time DESC LIMIT 100", 
        (trade_type,)
    ).fetchall()
    trades_list = [dict(t) for t in trades_list_query]
    
    # Equity Curve
    equity_query = conn.execute(
        "SELECT exit_time, pnl FROM trades WHERE trade_type = ? ORDER BY exit_time ASC", 
        (trade_type,)
    ).fetchall()
    
    equity_curve = []
    current_equity = 10000.0
    if equity_query:
        first_date = equity_query[0]["exit_time"].split(" ")[0]
        equity_curve.append({"date": first_date, "equity": current_equity})
        
    for t in equity_query:
        current_equity += t["pnl"]
        date = t["exit_time"].split(" ")[0]
        if equity_curve and equity_curve[-1]["date"] == date:
            equity_curve[-1]["equity"] = round(current_equity, 2)
        else:
            equity_curve.append({
                "date": date,
                "equity": round(current_equity, 2)
            })
            
    # Breakdowns
    longs = [t for t in trades if t["direction"] == "Long"]
    shorts = [t for t in trades if t["direction"] == "Short"]
    long_pnl = sum(t["pnl"] for t in longs)
    short_pnl = sum(t["pnl"] for t in shorts)
    
    import datetime
    dow_pnl = {0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0}
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    
    for t in trades:
        dt = datetime.datetime.fromisoformat(t["exit_time"])
        dow_pnl[dt.weekday()] += t["pnl"]
        
    dow_breakdown = [{"name": days[k], "pnl": round(v, 2)} for k, v in dow_pnl.items() if v != 0]
    
    breakdowns = {
        "direction": [
            {"name": "Long", "value": round(long_pnl, 2)},
            {"name": "Short", "value": round(short_pnl, 2)}
        ],
        "day_of_week": dow_breakdown
    }
    
    conn.close()
    
    return {
        "metrics": metrics,
        "trades": trades_list,
        "equity-curve": equity_curve,
        "breakdowns": breakdowns
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
                
    print("Static data exported to frontend/public/data/")

if __name__ == "__main__":
    main()
