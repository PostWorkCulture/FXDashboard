import sqlite3
import pandas as pd
import vectorbt as vbt
import os
import warnings
warnings.filterwarnings("ignore")

def populate_database():
    print("Running backtest to generate data...")
    # Path to data
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(os.path.dirname(script_dir))
    data_path = os.path.join(project_dir, "data", "EURUSD_H1.csv") 
    
    if not os.path.exists(data_path):
        print(f"Data file not found at {data_path}")
        return

    df = pd.read_csv(data_path, index_col='time', parse_dates=True)
    
    # Filter data up to Jan last year (end of 2024)
    df = df.loc[:'2024-12-31']
    
    close = df['close']
    high = df['high']
    low = df['low']
    open_p = df['open']
    
    avg_price = close.mean() 
    pip_pct = 0.0001 / avg_price
    
    rsi = vbt.RSI.run(close, window=14).rsi
    l_rsi = (rsi < 25) & (rsi.shift(1) >= 25)
    s_rsi = (rsi > 75) & (rsi.shift(1) <= 75)
    
    bad_days = df.index.dayofweek.isin([1, 2])
    bad_hours = df.index.hour.isin([9, 13, 22])
    l_rsi = l_rsi & (~bad_days) & (~bad_hours)
    s_rsi = s_rsi & (~bad_days) & (~bad_hours)
    
    sl = 40 * pip_pct
    tp = 80 * pip_pct 
    
    pf = vbt.Portfolio.from_signals(
        close, entries=l_rsi, short_entries=s_rsi,
        high=high, low=low, open=open_p,
        sl_stop=sl, tp_stop=tp, 
        size=1, size_type='amount', freq='1h'
    )
    
    trades = pf.trades.records_readable
    
    # Connect to SQLite DB
    db_path = os.path.join(script_dir, "trades.db")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS trades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trade_type TEXT,
        symbol TEXT,
        direction TEXT,
        entry_time TEXT,
        exit_time TEXT,
        entry_price REAL,
        exit_price REAL,
        pnl REAL,
        is_win BOOLEAN
    )
    ''')
    
    # Clear existing backtest trades
    cursor.execute("DELETE FROM trades WHERE trade_type='backtest'")
    
    insert_data = []
    
    # Simulate a standard lot where 1 pip = $10. 
    # Return * 10000 roughly scales the percentage return to dollars on a $10,000 account (or 1 standard lot depending on leverage).
    for index, row in trades.iterrows():
        direction = "Long" if row['Direction'] == 'Long' else "Short"
        pnl_dollar = row['Return'] * 10000
        is_win = pnl_dollar > 0
        
        insert_data.append((
            "backtest",
            "EURUSD",
            direction,
            str(row['Entry Timestamp']),
            str(row['Exit Timestamp']),
            row['Avg Entry Price'],
            row['Avg Exit Price'],
            pnl_dollar,
            is_win
        ))
        
    cursor.executemany('''
        INSERT INTO trades (trade_type, symbol, direction, entry_time, exit_time, entry_price, exit_price, pnl, is_win)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', insert_data)
    
    conn.commit()
    conn.close()
    print(f"Inserted {len(insert_data)} backtest trades into trades.db using final H1 strategy")

if __name__ == "__main__":
    populate_database()
