import random
from datetime import datetime, timedelta

def generate_mock_trades(num_trades=100):
    trades = []
    symbols = ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD", "BTCUSD"]
    
    current_time = datetime.now() - timedelta(days=90)
    current_equity = 10000.0
    equity_curve = [{"date": current_time.strftime("%Y-%m-%d"), "equity": current_equity}]
    
    for i in range(1, num_trades + 1):
        # Time gap between trades
        current_time += timedelta(hours=random.randint(2, 48))
        
        symbol = random.choice(symbols)
        direction = random.choice(["Long", "Short"])
        
        # Win rate around 55%
        is_win = random.random() < 0.55
        
        if is_win:
            pnl = random.uniform(50.0, 300.0)
        else:
            pnl = random.uniform(-200.0, -50.0)
            
        current_equity += pnl
        
        # Entry/Exit prices (mocked around 1.0 for simplicity)
        entry_price = random.uniform(1.0, 1.5)
        exit_price = entry_price + (pnl / 10000.0) if direction == "Long" else entry_price - (pnl / 10000.0)
        
        trades.append({
            "id": i,
            "symbol": symbol,
            "direction": direction,
            "entry_time": current_time.strftime("%Y-%m-%d %H:%M:%S"),
            "exit_time": (current_time + timedelta(hours=random.randint(1, 8))).strftime("%Y-%m-%d %H:%M:%S"),
            "entry_price": round(entry_price, 5),
            "exit_price": round(exit_price, 5),
            "pnl": round(pnl, 2),
            "is_win": is_win
        })
        
        equity_curve.append({
            "date": current_time.strftime("%Y-%m-%d"),
            "equity": round(current_equity, 2)
        })
        
    return trades, equity_curve

# Generate data on startup
MOCK_TRADES, MOCK_EQUITY_CURVE = generate_mock_trades(200)
