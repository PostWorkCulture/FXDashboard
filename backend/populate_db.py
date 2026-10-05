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
    data_path = os.path.join(project_dir, "data", "EURUSD_M15.csv") 
    
    if not os.path.exists(data_path):
        print(f"Data file not found at {data_path}")
        return

    df = pd.read_csv(data_path, index_col='time', parse_dates=True)
    
    # Filter data up to Jan last year (end of 2024)
    df = df.loc[:'2024-12-31']
    
    close = df['close']
    high = df['high']
    low = df['low']
    
    asian_session_mask = (df.index.hour >= 0) & (df.index.hour < 8)
    asian_high = df[asian_session_mask]['high'].groupby(df[asian_session_mask].index.date).max()
    asian_low = df[asian_session_mask]['low'].groupby(df[asian_session_mask].index.date).min()
    
    ah = pd.Series(index=df.index, dtype=float)
    al = pd.Series(index=df.index, dtype=float)
    
    for date, val in asian_high.items():
        try:
            timestamp = pd.Timestamp(date) + pd.Timedelta(hours=8)
            idx = df.index.searchsorted(timestamp)
            if idx < len(df):
                ah.iloc[idx] = val
                al.iloc[idx] = asian_low[date]
        except:
            pass
            
    ah = ah.ffill()
    al = al.ffill()
    
    london_mask = (df.index.hour >= 8) & (df.index.hour <= 12)
    long_entries = high.vbt.crossed_above(ah) & london_mask
    short_entries = low.vbt.crossed_below(al) & london_mask
    
    def first_signal_per_day(series):
        true_only = series[series]
        first_indices = true_only.groupby(true_only.index.date).head(1).index
        res = pd.Series(False, index=series.index)
        res.loc[first_indices] = True
        return res
        
    short_entries = first_signal_per_day(short_entries)
    long_entries = first_signal_per_day(long_entries)
    
    pip_size = 0.0001
    pips = 15 # Choosing 15 as a good default based on standard breakout
    sl_pct = (pips * pip_size) / close
    tp_pct = (pips * pip_size) / close
    
    pf = vbt.Portfolio.from_signals(
        close,
        entries=long_entries,
        short_entries=short_entries,
        sl_stop=sl_pct,
        tp_stop=tp_pct,
        fees=0.0001, 
        freq='15min'
    )
    
    trades = pf.trades.records_readable
    # The columns are like: Trade Id, Column, Size, Entry Timestamp, Entry Price, Exit Timestamp, Exit Price, PnL, Return, Direction, Status, Position Id
    
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
    
    # Clear existing backtest trades to prevent duplicates on rerun
    cursor.execute("DELETE FROM trades WHERE trade_type='backtest'")
    
    insert_data = []
    
    # We will simulate a $10,000 starting account and use the returns to calculate dollar PnL
    # Or just use the raw vectorbt PnL which is based on units.
    # By default vbt uses 100 units starting capital. Let's scale it so PnL looks realistic for standard lots.
    for index, row in trades.iterrows():
        # Direction in vectorbt: Long is 0, Short is 1
        direction = "Long" if row['Direction'] == 'Long' else "Short"
        # Scale PnL to make it look like a standard lot trade (approx $10 per pip)
        # return is percentage, so if we assume a standard position size that risks $150 (15 pips)
        # we can just use the return percentage * 10000 
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
    print(f"Inserted {len(insert_data)} backtest trades into trades.db")

if __name__ == "__main__":
    populate_database()
