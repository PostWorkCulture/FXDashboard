import sqlite3
import os
import random
from datetime import datetime, timedelta

def populate_live_trades():
    db_path = os.path.join(os.path.dirname(__file__), "trades.db")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Delete existing live trades
    cursor.execute("DELETE FROM trades WHERE trade_type='live'")
    
    insert_data = []
    
    # Generate live trades starting from Jan 1 2025 up to today
    start_date = datetime(2025, 1, 1)
    end_date = datetime.now()
    
    current_time = start_date
    symbols = ["EURUSD", "GBPUSD", "USDJPY"]
    
    while current_time < end_date:
        # 1 or 2 trades per day max
        if random.random() < 0.3:
            symbol = random.choice(symbols)
            direction = random.choice(["Long", "Short"])
            
            is_win = random.random() < 0.6 # 60% win rate live
            if is_win:
                pnl = random.uniform(50, 200)
            else:
                pnl = random.uniform(-150, -50)
                
            entry_price = random.uniform(1.0, 1.5)
            exit_price = entry_price + (pnl / 10000.0) if direction == "Long" else entry_price - (pnl / 10000.0)
            
            entry_time_str = current_time.strftime("%Y-%m-%d %H:%M:%S")
            exit_time_str = (current_time + timedelta(hours=random.randint(1, 8))).strftime("%Y-%m-%d %H:%M:%S")
            
            insert_data.append((
                "live",
                symbol,
                direction,
                entry_time_str,
                exit_time_str,
                entry_price,
                exit_price,
                pnl,
                is_win
            ))
            
        current_time += timedelta(days=1)

    cursor.executemany('''
        INSERT INTO trades (trade_type, symbol, direction, entry_time, exit_time, entry_price, exit_price, pnl, is_win)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', insert_data)
    
    conn.commit()
    conn.close()
    print(f"Inserted {len(insert_data)} mock live trades into trades.db")

if __name__ == "__main__":
    populate_live_trades()
