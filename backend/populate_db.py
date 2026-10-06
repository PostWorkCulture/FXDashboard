import sqlite3
import pandas as pd
import vectorbt as vbt
import os
import warnings
import numpy as np
warnings.filterwarnings("ignore")

def populate_database():
    print("Running extreme-detail backtest to generate data...")
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(os.path.dirname(script_dir))
    data_path = os.path.join(project_dir, "data", "EURUSD_H1.csv") 
    
    if not os.path.exists(data_path):
        print(f"Data file not found at {data_path}")
        return

    df = pd.read_csv(data_path, index_col='time', parse_dates=True)
    # Include data up to the latest available (2026)
    df = df.loc['2023-01-01':]
    
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
    
    sl_pips = 40
    tp_pips = 80
    sl = sl_pips * pip_pct
    tp = tp_pips * pip_pct 
    
    pf = vbt.Portfolio.from_signals(
        close, entries=l_rsi, short_entries=s_rsi,
        high=high, low=low, open=open_p,
        sl_stop=sl, tp_stop=tp, 
        size=1, size_type='amount', freq='1h'
    )
    
    trades = pf.trades.records_readable
    
    db_path = os.path.join(script_dir, "trades.db")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Drop and recreate for extreme detail
    cursor.execute("DROP TABLE IF EXISTS trades")
    cursor.execute('''
    CREATE TABLE trades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trade_type TEXT,
        symbol TEXT,
        direction TEXT,
        entry_time TEXT,
        exit_time TEXT,
        entry_price REAL,
        exit_price REAL,
        pnl REAL,
        is_win BOOLEAN,
        duration_hours REAL,
        mae_pips REAL,
        mfe_pips REAL,
        r_multiple REAL,
        setup TEXT,
        mistakes TEXT,
        notes TEXT
    )
    ''')
    
    insert_data = []
    
    for index, row in trades.iterrows():
        direction = "Long" if row['Direction'] == 'Long' else "Short"
        pnl_dollar = row['Return'] * 10000
        is_win = pnl_dollar > 0
        
        entry_t = row['Entry Timestamp']
        exit_t = row['Exit Timestamp']
        
        duration = (exit_t - entry_t).total_seconds() / 3600.0
        
        # Calculate MAE and MFE
        trade_window = df.loc[entry_t:exit_t]
        if direction == "Long":
            max_price = trade_window['high'].max()
            min_price = trade_window['low'].min()
            mfe_pips = (max_price - row['Avg Entry Price']) / 0.0001
            mae_pips = (row['Avg Entry Price'] - min_price) / 0.0001
        else:
            max_price = trade_window['high'].max()
            min_price = trade_window['low'].min()
            mfe_pips = (row['Avg Entry Price'] - min_price) / 0.0001
            mae_pips = (max_price - row['Avg Entry Price']) / 0.0001
            
        r_multiple = pnl_dollar / (sl_pips * 10) # Assuming $10 per pip for a standard lot
        
        insert_data.append((
            "backtest",
            "EURUSD",
            direction,
            str(entry_t),
            str(exit_t),
            row['Avg Entry Price'],
            row['Avg Exit Price'],
            pnl_dollar,
            is_win,
            duration,
            mae_pips,
            mfe_pips,
            r_multiple,
            "RSI Reversal",
            "", # Mistakes
            "Automated execution." # Notes
        ))
        
    cursor.executemany('''
        INSERT INTO trades (trade_type, symbol, direction, entry_time, exit_time, entry_price, exit_price, pnl, is_win, duration_hours, mae_pips, mfe_pips, r_multiple, setup, mistakes, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', insert_data)
    
    conn.commit()
    conn.close()
    print(f"Inserted {len(insert_data)} ultra-detailed backtest trades into trades.db")

if __name__ == "__main__":
    populate_database()
