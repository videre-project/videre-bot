import re, requests, json
import numpy as np
import pandas as pd

from functools import reduce

import matplotlib.pyplot as plt
import seaborn as sns

import sys, io, base64
from tabulate import tabulate

import warnings

warnings.simplefilter(action='ignore', category=FutureWarning)
warnings.simplefilter(action='ignore', category=RuntimeWarning)
warnings.simplefilter(action='ignore', category=UserWarning)

# Generate and return card price history
def getPriceHistory(matchedName, set, time_interval = 14):
    global card_slug
    def findItem(data, item, match, attribute):
        for i in range(len(data)):
            if data[i][match] == item:
                return data[i][attribute]
                break
            if data[i][match] == item.split(" // ")[0]:
                return data[i][attribute]
                break

    set_id = findItem(
        data = requests.get("http://api.mtgstocks.com/card_sets").json(),
        item = set, match = 'abbreviation',
        attribute = 'id'
    )

    assert set_id is not None, "No set found."

    try:
        card_slug = findItem(
            data = requests.get(f"https://api.mtgstocks.com/card_sets/{ set_id }").json()['prints'],
            item = matchedName, match = 'name',
            attribute = 'slug'
        )
    except:
        mtgstocksAPI = requests.get(f"https://api.mtgstocks.com/search/autocomplete/{ matchedName.split('//')[0] }")
        id, name, card_slug = mtgstocksAPI.json()[0].values()

    # Get full historical pricing data
    pricesAPI = requests.get(f"https://api.mtgstocks.com/prints/{ card_slug }/prices")

    # Extract prices by category
    low = pd.DataFrame(pricesAPI.json()["low"], columns = ["Date", "Low"])
    average = pd.DataFrame(pricesAPI.json()["avg"], columns = ["Date", "Average"])
    high = pd.DataFrame(pricesAPI.json()["high"], columns = ["Date", "High"])
    foil = pd.DataFrame(pricesAPI.json()["foil"], columns = ["Date", 'Foil'])
    market = pd.DataFrame(pricesAPI.json()["market"], columns = ["Date", "Market"])
    market_foil = pd.DataFrame(pricesAPI.json()["market_foil"], columns = ["Date", "Market Foil"])

    # Merge columns and format epoch as date index
    combined_prices = reduce(
        lambda x,y: pd.merge(x,y, on = "Date", how = "outer"),
        [low, average, market, high, foil, market_foil]
    )
    combined_prices["Date"] = pd.to_datetime(combined_prices["Date"], unit = "ms")
    combined_prices = combined_prices.sort_values(by = ["Date"], ascending = True)
    combined_prices["Date"] = combined_prices["Date"].apply(lambda x: x.strftime("%b %d, %Y"))
    combined_prices = combined_prices.set_index("Date")

    # # Reduce outliers in prices
    # def is_outlier(points, thresh=1000):
    #     if len(points.shape) == 1:
    #         points = points[:,None]
    #     median = np.median(points, axis=0)
    #     diff = np.sum((points - median)**2, axis=-1)
    #     diff = np.sqrt(diff)
    #     med_abs_deviation = np.median(diff)
    #
    #     modified_z_score = 0.6745 * diff / med_abs_deviation
    #
    #     return modified_z_score > thresh

    colorMap = {
        'Low': 'C0',
        'Average': 'C1',
        'Market': 'C2',
        'High': 'C3',
        'Foil': 'C4',
        'Market Foil': 'C5'
    }

    # Generate line plot for timeseries
    def render_fig_table(data, columns, xlabel, ylabel, title, fig_width = 11, fig_height = 4):
        sns.set(rc = { "figure.figsize" : (fig_width, fig_height) })
        custom_style = {
            'axes.labelcolor': 'white',
            'grid.color': '#5D6269',#'#40444B',
            'axes.edgecolor': '#292B2F',
            'xtick.color': 'white',
            'ytick.color': 'white'
        }
        sns.set_style("darkgrid", rc=custom_style)

        fig, ax = plt.subplots()
        fig.patch.set_facecolor('#292B2F')
        ax.set_facecolor('#2F3136')
        for cols in columns:
            # Format category names with latest price for chart legend
            category_name = cols
            if (data[cols].iloc[-1] + data[cols].iloc[-2] > -1):
                category_name += " (${:,.2f})".format(data[cols].iloc[-1])

            filtered = data[cols][data[cols] < (data[cols].mean() + 1000)]
            ax.plot(
                filtered, #[~is_outlier(data[cols])]],
                label = category_name.replace(" ($nan)", ""),
                c = colorMap[cols]
            )
            if len(data) > 7: ax.xaxis.set_major_locator(plt.MaxNLocator(7))
            plt.setp(
                ax.legend(
                    facecolor = '#40444B',
                    edgecolor = '#292B2F',
                    loc = 'center left'
                ).get_texts(),
                color = 'w'
            )
            # ax.set_xlabel(xlabel)
            ax.set_ylabel(ylabel)
            # ax.set_title(title)

        # Write plot to bytes buffer
        buffer = io.BytesIO()

        plt.tight_layout(pad=1.0, w_pad=1.5, h_pad=1.0)
        plt.savefig(buffer, format = "png", dpi = 100)
        plt.close()

        return base64.b64encode(buffer.getvalue()).decode("utf-8").replace("\n", "")

    # Call plotting function
    plt_IObytes = render_fig_table(
        combined_prices.tail(time_interval),
        ['Foil', 'Market Foil', 'Average', 'Market', 'Low'], # combined_prices.columns,
        xlabel = "Dates", ylabel = "TCGplayer Price (USD $)",
        title = f"Price History for { matchedName }",
        fig_width = 9, fig_height = 3,
    )

    # Format currency for table output
    for col in combined_prices.columns:
        combined_prices[col] = combined_prices[col].map("${:,.2f}".format).replace("$nan", "-")

    # Format json output
    data = {}
    data["graph"] = plt_IObytes
    # data["data"] = combined_prices.reset_index().to_dict(orient = "list")
    data["url"] = f"https://www.mtgstocks.com/prints/{ card_slug }"
    # data["table"] = tabulate(
    #     combined_prices,
    #     tablefmt = "rst",
    #     headers = ["Date", "Low", "Average", "Market", "High", "Foil", "Market Foil"]
    # )

    return json.dumps(data)

# Helper function for templatizing arguments array
def get_args(message, command):
    self = re.compile(" --(.*?) ").split(message[len(command):])
    for i in range(len(self)):
        self[i:i+1] = re.compile(" -").split(self[i])
    # for i in range(len(self)-1):
    #     self[i+1] = re.sub(r"-", "", self[i+1])
    return self

# Helper function for setting flags via argv
def get_argv(arg, default = None):
    if len(sys.argv) > 1:
        self = self = get_args(" ".join(sys.argv), str(sys.argv[0]))
        if arg in self:
            pos = self.index(arg)
            self.remove(arg)
            return self[pos]
    return default

# argv parameters
CARDNAME = get_argv("cardname")
SET = get_argv("set")

try:
    print(getPriceHistory(CARDNAME, SET))
except:
    print("")

sys.stdout.flush()
