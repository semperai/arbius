import matplotlib.pyplot as plt
from matplotlib.ticker import FuncFormatter
import time

ms = 1_000_000 # max supply

def target_ts(t):
    return ms * (1 - 1 / 2 ** (t/(60*60*24*365)))

timestamps = []
values = []

for year in range(0, 10):
    for step in range(0, 100):
        t = year + step/100
        timestamps.append(t)
        values.append(target_ts(60*60*24*365*t))



# Plot the graph
plt.plot(timestamps, values)

# Format the x-axis to show years instead of timestamps
def x_fmt(x, pos):
    return str(int(x))
formatter = FuncFormatter(x_fmt)
plt.gca().xaxis.set_major_formatter(formatter)

# Format the y-axis to show full value instead of scientific notation
plt.ticklabel_format(style='plain', axis='y')

plt.xlabel('Year')
plt.ylabel('Total Supply')

plt.title('Expected Total Supply')
plt.show()
