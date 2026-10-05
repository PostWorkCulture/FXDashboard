from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
import os
from pydantic import BaseModel

app = FastAPI(title="Trading Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db_connection():
    db_path = os.path.join(os.path.dirname(__file__), "trades.db")
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

@app.get("/api/metrics")
def get_metrics(trade_type: str = "backtest"):
    conn = get_db_connection()
    trades = conn.execute("SELECT * FROM trades WHERE trade_type = ?", (trade_type,)).fetchall()
    conn.close()
    
    total_trades = len(trades)
    winning_trades = sum(1 for t in trades if t["is_win"])
    win_rate = (winning_trades / total_trades) * 100 if total_trades > 0 else 0
    total_pnl = sum(t["pnl"] for t in trades)
    
    gross_profit = sum(t["pnl"] for t in trades if t["pnl"] > 0)
    gross_loss = abs(sum(t["pnl"] for t in trades if t["pnl"] < 0))
    profit_factor = gross_profit / gross_loss if gross_loss > 0 else 0
    
    return {
        "total_trades": total_trades,
        "win_rate": round(win_rate, 2),
        "total_pnl": round(total_pnl, 2),
        "profit_factor": round(profit_factor, 2)
    }

@app.get("/api/trades")
def get_trades(trade_type: str = "backtest", limit: int = 100):
    conn = get_db_connection()
    trades = conn.execute(
        "SELECT * FROM trades WHERE trade_type = ? ORDER BY exit_time DESC LIMIT ?", 
        (trade_type, limit)
    ).fetchall()
    conn.close()
    return [dict(t) for t in trades]

@app.get("/api/equity-curve")
def get_equity_curve(trade_type: str = "backtest"):
    conn = get_db_connection()
    trades = conn.execute(
        "SELECT exit_time, pnl FROM trades WHERE trade_type = ? ORDER BY exit_time ASC", 
        (trade_type,)
    ).fetchall()
    conn.close()
    
    equity_curve = []
    current_equity = 10000.0  # Starting balance
    
    if trades:
        # Initial point
        first_date = trades[0]["exit_time"].split(" ")[0]
        equity_curve.append({"date": first_date, "equity": current_equity})
        
    for t in trades:
        current_equity += t["pnl"]
        date = t["exit_time"].split(" ")[0]
        # Only keep the last equity value for each date
        if equity_curve and equity_curve[-1]["date"] == date:
            equity_curve[-1]["equity"] = round(current_equity, 2)
        else:
            equity_curve.append({
                "date": date,
                "equity": round(current_equity, 2)
            })
            
    return equity_curve

@app.get("/api/breakdowns")
def get_breakdowns(trade_type: str = "backtest"):
    conn = get_db_connection()
    trades = conn.execute("SELECT * FROM trades WHERE trade_type = ?", (trade_type,)).fetchall()
    conn.close()
    
    # By Direction (Long/Short)
    longs = [t for t in trades if t["direction"] == "Long"]
    shorts = [t for t in trades if t["direction"] == "Short"]
    
    long_pnl = sum(t["pnl"] for t in longs)
    short_pnl = sum(t["pnl"] for t in shorts)
    
    # By Symbol (If there were more than one, this would be useful. Let's group anyway)
    symbol_pnl = {}
    for t in trades:
        sym = t["symbol"]
        symbol_pnl[sym] = symbol_pnl.get(sym, 0) + t["pnl"]
        
    # By Day of Week
    import datetime
    dow_pnl = {0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0}
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    
    for t in trades:
        dt = datetime.datetime.fromisoformat(t["entry_time"])
        dow_pnl[dt.weekday()] += t["pnl"]
        
    dow_breakdown = [{"name": days[k], "pnl": round(v, 2)} for k, v in dow_pnl.items() if v != 0]
        
    return {
        "direction": [
            {"name": "Long", "value": round(long_pnl, 2)},
            {"name": "Short", "value": round(short_pnl, 2)}
        ],
        "symbols": [{"name": k, "value": round(v, 2)} for k, v in symbol_pnl.items()],
        "day_of_week": dow_breakdown
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
