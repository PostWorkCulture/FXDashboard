with open(r'C:\Users\peteb\OneDrive\Documents\AI\Projects\Trading\dashboard\frontend\src\components\Sidebar.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if 'src="data:image/jpeg;base64,' in line:
        new_lines.append('            src={`${process.env.NODE_ENV === "production" ? "/FXDashboard" : ""}/icons/logo.jpg`}\n')
    else:
        new_lines.append(line)

with open(r'C:\Users\peteb\OneDrive\Documents\AI\Projects\Trading\dashboard\frontend\src\components\Sidebar.tsx', 'w') as f:
    f.writelines(new_lines)
