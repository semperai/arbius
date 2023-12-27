# this is for a token which has 50% minted first year
# 75% 2nd year
# 87.5% 3rd year
# etc..

sr = 1 # starting reward
ms = 1_000_000 # max supply

# our expected emission curve based on time
# reward will target this, but will go slightly faster assuming difficulty is constantly rising
def target_ts(t):
    return ms * (1 - 1 / 2 ** (t/(60*60*24*365)))

# difficulty based on expected total supply to total supply wrt time
# t&ts must be > 0
def diff(t, ts):
    # if nobody mines for a while, we shouldnt go to infinite rewards
    MAX_MULT=100

    # get target total supply for this time
    e = target_ts(t)

    # ratio of total supply with expected total supply
    d = ts / e

    # print('d', d)
    if (d < 0.933561):
        return 100

    # exponential falloff of rewards depending on how much above target
    # note: will also boost if behind target
    return (1/2) ** ((1+((d-1)*100))-1)
    # return (d-1)*100

def difft(d):
    # exponential falloff of rewards depending on how much above target
    # note: will also boost if behind target
    return (1/2) ** ((d-1)*100)

# for i in range(1, 100):
#     c = 0.9335614381022527 + i*0.000000000000000001
#     print(c, difft(c))
# exit()

# calculate this tasks reward based on time and total supply
def reward(t, ts):
    return (((ms - ts) * sr) / ms) * diff(t, ts)


print('Target total supply by year');
for year in range(0, 10):
    for step in range(0, 100):
        t = year + step/100
        print('\t', t, target_ts(60*60*24*365*t))

print()

# ratio of target total supply to total supply
# lower values mean we're behind
print('Difficulty tests:')
difftests = [0.93, 0.94, 0.95, 0.96, 0.97, 0.98, 0.99, 0.995, 0.999, 1, 1.001, 1.005, 1.01, 1.02, 1.03, 1.04, 1.05, 1.06, 1.07, 1.08, 1.09, 1.1, 1.2]
for test in difftests:
    print('\t', test, diff(1_000_000, target_ts(1_000_000) * test))

print()

# Different block rewards at one year mark, based on how far away from target we are
# I expect we would be above expected, potentially by a lot if popular
# But this will not lead to much faster inflation
print('Reward tests:')
rewardtests = [100_000, 450_000, 490_000, 495_000, 500_000, 505_000, 510_000, 515_000, 550_000, 600_000]
for test in rewardtests:
    # print('\t', test, reward(60*60*24*365, test))
    print('\t', test, diff(60*60*24*365, test))

# uncomment this for a simulation of 1 task every second until we reach 550k total supply
# (33_590_743 tasks in total)
# ts = 1
# t = 1
# while(ts < 550_000):
#     ts += reward(t, ts)
#     t += 1
#     if int(ts) % 10000 == 0:
#         print('\t', t, ts)
