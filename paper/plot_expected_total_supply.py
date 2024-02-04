import matplotlib.pyplot as plt
from matplotlib.ticker import FuncFormatter
import time

ms = 1_000_000 # max supply
pms = 600_000 # psuedo max supply

def target_ts(t):
    return pms * (1 - 1 / 2 ** (t/(60*60*24*365)))

timestamps = []
values = []

for year in range(0, 10):
    for step in range(0, 100):
        t = year + step/100
        timestamps.append(t)

        team_released = min(100_000 * 0.25 * t, 100_000) # 4yr vest
        private_sale_released = min(100_000 * 0.5 * t, 100_000) # 2yr vest
        dao_released = min(100_000 * 0.25 * t, 100_000) # 4yr vest

        starting_liq = 10_000

        lpi_released = 0
        if year < 1:
            lpi_released += 36_000 * step/100
        elif year >= 1:
            lpi_released += 36_000
            if year < 2:
                lpi_released += 27_000 * step/100
            elif year >= 2:
                lpi_released += 27_000
                if year < 3:
                    lpi_released += 18_000 * step/100
                elif year >= 3:
                    lpi_released += 18_000
                    if year < 4:
                        lpi_released += 9_000 * step/100
                    elif year >= 4:
                        lpi_released += 9_000


        mining_released = target_ts(60*60*24*365*t)

        total_released = team_released + private_sale_released + dao_released + starting_liq + lpi_released + mining_released

        values.append([team_released, private_sale_released, dao_released, starting_liq, lpi_released, mining_released, total_released])


fig1, ax1 = plt.subplots()

ax1.plot(timestamps, [x[6] for x in values], label='Total Supply', c='k', linewidth=1)
ax1.plot(timestamps, [x[5] for x in values], label='Mining', c='c', linewidth=1)
ax1.plot(timestamps, [x[0]+x[1]+x[2]+x[3]+x[4] for x in values], label='Programs', c='r', linewidth=1)

# Plot the graph
# plt.plot(timestamps, values)
ax1.legend(['Total', 'Mining', 'Programs'])


# plt.set_xlabel('Year')
# plt.set_ylabel('Total Supply')


# Format the x-axis to show years instead of timestamps
def x_fmt(x, pos):
    return str(int(x))
formatter = FuncFormatter(x_fmt)
plt.gca().xaxis.set_major_formatter(formatter)

# Format the y-axis to show full value instead of scientific notation
plt.ticklabel_format(style='plain', axis='y')

plt.xlabel('Year')
plt.ylabel('Total Supply')

# plt.title('Expected Total Supply Contribution Over Time')
plt.savefig('combined.png')


fig2, ax2 = plt.subplots(nrows=2, ncols=3, figsize=(14, 4))
ax2[0][0].plot(timestamps, [x[0] for x in values], label='Team', c='r', linewidth=1)
ax2[0][0].legend(['Team'])

ax2[0][1].plot(timestamps, [x[1] for x in values], label='Private Sale', c='g', linewidth=1)
ax2[0][1].legend(['Private Sale'])

ax2[0][2].plot(timestamps, [x[2] for x in values], label='DAO', c='b', linewidth=1)
ax2[0][2].legend(['DAO'])

ax2[1][0].plot(timestamps, [x[3] for x in values], label='Initial Liquidity', c='y', linewidth=1)
ax2[1][0].legend(['Initial Liquidity'])

ax2[1][1].plot(timestamps, [x[4] for x in values], label='Liquidity Incentivization', c='m', linewidth=1)
ax2[1][1].legend(['Liquidity Incentivization'])

ax2[1][2].plot(timestamps, [x[5] for x in values], label='Mining', c='c', linewidth=1)
ax2[1][2].legend(['Mining'])


fig2.savefig('separate.png')

