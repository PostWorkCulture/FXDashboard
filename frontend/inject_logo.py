import base64
import re

with open(r'C:\Users\peteb\OneDrive\Documents\AI\Projects\Trading\dashboard\frontend\public\logo.jpg', 'rb') as f:
    encoded = base64.b64encode(f.read()).decode('utf-8')
    data_uri = 'data:image/jpeg;base64,' + encoded

with open(r'C:\Users\peteb\OneDrive\Documents\AI\Projects\Trading\dashboard\frontend\src\components\Sidebar.tsx', 'r') as f:
    content = f.read()

new_content = re.sub(
    r'src=\{`\$\{process\.env\.NODE_ENV === "production" \? "/FXDashboard" : ""\}/logo\.jpg`\}',
    f'src="{data_uri}"',
    content
)

with open(r'C:\Users\peteb\OneDrive\Documents\AI\Projects\Trading\dashboard\frontend\src\components\Sidebar.tsx', 'w') as f:
    f.write(new_content)

print("Injected base64 logo")
