# Chart Features & Tools Specification

This document details every feature, tool, and option required to reach parity with professional trading platforms (e.g., Dhan, Sahi, Groww, cTrader, and ThinqProfit) for our in-house, fully custom chart engine.

For every single tool, feature, or option, this document details its **Name**, **Purpose**, and **Product Role**.

---

## 1. Chart Types & Series Modes

### 1.1 Candlestick Chart (Default)
* **Purpose**: Displays the open, high, low, and close (OHLC) values of an asset for a specific time interval using filled rectangular bodies and thin wicks.
* **Role**: The foundational visual representation for price-action analysis. Bullish candles are colored teal/green (default `#26a69a`) and bearish candles are colored red (default `#ef5350`). Used by over 90% of technical traders to spot patterns and trends.

### 1.2 Line Chart
* **Purpose**: Renders price data as a continuous line connecting the close prices of consecutive intervals.
* **Role**: Simplifies the visual interface by eliminating intraday/intrabar noise (highs and lows). Ideal for identifying major macro support/resistance zones, line patterns (like Head & Shoulders), and for general/retail investors looking for clean visuals.

### 1.3 Step Line Chart
* **Purpose**: A line chart variation where price levels are connected via vertical and horizontal steps rather than diagonal lines.
* **Role**: Accurately highlights discrete, static price transitions. Extremely useful in illiquid markets, tick-charts, or when assessing order-book level shifts where prices jump in discrete increments.

### 1.4 Area Chart
* **Purpose**: Draws a close-price line with a color-gradient fill underneath extending to the bottom of the chart scale.
* **Role**: Visually emphasizes the magnitude of price movements and asset value growth over time. Often used on homepage watchlists, portfolio tracking screens, and summary dashboards to provide an appealing, rapid overview.

### 1.5 Heikin Ashi Chart
* **Purpose**: Transforms standard candle values using an averaging formula:
  * $Close = (Open + High + Low + Close) / 4$
  * $Open = (PrevOpen + PrevClose) / 2$
  * $High = \max(High, Open, Close)$
  * $Low = \min(Low, Open, Close)$
* **Role**: Filters out trend noise by smoothing price action. Bullish trends show consecutive solid green candles without lower wicks; bearish trends show consecutive red candles without upper wicks. Used for trend-following and swing trading strategies.

### 1.6 Hollow Candlestick Chart
* **Purpose**: Displays candlesticks where bullish candles have transparent/hollow bodies with colored borders, and bearish candles have solid filled bodies.
* **Role**: Adds another dimension to candlestick parsing. It helps traders distinguish between bullish sessions and down gaps/sessions where price ended positive relative to open but negative relative to previous close.

### 1.7 Bar Chart (OHLC)
* **Purpose**: Displays price intervals as vertical lines representing the High-Low range, with a left horizontal tick for Open and a right horizontal tick for Close.
* **Role**: A traditional western charting style. Offers less visual weight than filled candlesticks, allowing traders to overlay multiple studies without cluttering the screen.

### 1.8 Renko Chart
* **Purpose**: Time-independent brick chart where new bricks are added only when price moves by a predefined threshold (box size).
* **Role**: Completely isolates price trend from time. Filters out lateral time noise (ranging hours/days), allowing swing traders to isolate clean support/resistance breakouts. Supports fixed box sizes and ATR-based dynamic box sizing.

### 1.9 Baseline Chart
* **Purpose**: Renders price as a line chart colored green when price is above a user-selected baseline level, and red when below.
* **Role**: Ideal for comparing current intraday price performance relative to a critical baseline, such as the Previous Day's Close (PDC) or a major breakout level.

---

## 2. Drawing Tools (Toolbar)

### 2.1 Trend Line
* **Purpose**: Draws a straight line segment between two selected time-price coordinates.
* **Role**: The core tool for technical analysis. Used to map uptrend supports, downtrend resistances, and chart pattern borders (channels, triangles).

### 2.2 Horizontal Line
* **Purpose**: Places an infinite horizontal line at a specific price level.
* **Role**: Marks major psychological levels, historical support/resistance zones, and daily highs/lows. Acts as a persistent horizontal reference.

### 2.3 Horizontal Ray
* **Purpose**: Draws a horizontal line starting at a specific point and extending infinitely to the right.
* **Role**: Marks levels that become relevant only after a specific point in time, avoiding visual clutter in past historical data.

### 2.4 Vertical Line
* **Purpose**: Places an infinite vertical line at a specific time/date coordinate.
* **Role**: Marks major time-based events such as earnings announcements, economic releases, session opens, or cycle thresholds.

### 2.5 Extended Line
* **Purpose**: Draws a line passing through two points and extending infinitely in both directions.
* **Role**: Identifies long-term diagonal support/resistance levels projected far into both the past and the future.

### 2.6 Ray
* **Purpose**: Draws a line segment starting at point A, passing through point B, and extending infinitely to the edge of the screen.
* **Role**: Projects a diagonal trendline forward in time from two historical anchor points to locate potential future support/resistance contacts.

### 2.7 Parallel Channel
* **Purpose**: Draws two parallel diagonal lines with a transparent color fill between them. Defined by 3 points (anchor 0 and 1 for the main line, anchor 2 for the channel width offset).
* **Role**: Identifies ascending, descending, or horizontal channels. Helps traders trade bounces off the channel boundaries and spot break-out/break-down patterns.

### 2.8 Rectangle
* **Purpose**: Draws a box defined by two diagonal corner points, filled with a transparent color.
* **Role**: Highlights lateral trading ranges, supply/demand zones, and consolidation/accumulation channels.

### 2.9 Fibonacci Retracement
* **Purpose**: Draws horizontal lines at standard percentage levels (0.0%, 23.6%, 38.2%, 50.0%, 61.8%, 78.6%, 100.0%) between a major swing high and swing low.
* **Role**: Predicts key retracement support and resistance levels during price corrections. Essential for pullback entry strategies.

### 2.10 Long Position Tool
* **Purpose**: Draws a dual green/red shaded risk-reward projection box from an entry price, containing a draggable target price (green) and stop-loss price (red).
* **Role**: Displays risk/reward ratios, target/stop percentages, and distance in price. Helps traders plan trades, check position size, and manage risk before order execution.

### 2.11 Short Position Tool
* **Purpose**: Mirror of the Long Position tool. Draws a dual red/green shaded risk-reward projection box where target is below entry and stop-loss is above.
* **Role**: Visualizes sell/short-sell setups, calculating risk-reward ratios for bearish positions.

### 2.12 Text Annotation
* **Purpose**: Places a custom text label at a specific coordinate.
* **Role**: Enables traders to record notes, trade setups, patterns identified (e.g. "Double Bottom"), or reminders directly on the chart.

### 2.13 Measure / Ruler Tool
* **Purpose**: Measures the absolute price difference, percentage change, and number of bars between two clicked coordinates.
* **Role**: Provides a quick way to measure price moves or timeframe lengths without leaving permanent drawings on the screen.

### 2.14 Price Label
* **Purpose**: Places a price tag pill on the right price scale connected to a specific price point.
* **Role**: Keeps target levels, entry levels, or key horizontal boundaries highlighted on the price axis.

### 2.15 Flag / Pin Marker
* **Purpose**: Draws a small colored flagpole and flag banner at a coordinate.
* **Role**: Marks critical execution points (e.g., "Buy Trigger", "Stop Trailed") or specific news items.

### 2.16 Angle Tool
* **Purpose**: Measures and displays the angle in degrees between two connected lines (defined by 3 points).
* **Role**: Measures trend velocity and acceleration. Used in Gann-angle strategies to determine if a trend is starting to lose momentum.

### 2.17 Path / Freehand Tool
* **Purpose**: Allows freeform drawing on the chart canvas via click-and-drag or touch.
* **Role**: Enables fast hand-drawn annotations (such as circles around candles or custom trend paths) that are not restricted to straight lines.

### 2.18 Eraser Tool
* **Purpose**: Deletes any individual drawing clicked by the user.
* **Role**: Cleans up specific drawings quickly without having to clear the entire chart.

---

## 3. Drawing Management & Toggles

### 3.1 Enable Drawing Toolbar
* **Purpose**: Shows or hides the drawing tool rail on the left.
* **Role**: Reclaims screen real estate for viewing price data when the user is done drawing.

### 3.2 Enable Magnet Mode
* **Purpose**: Snaps all placed drawing points to the nearest OHLC price value of the closest bar.
* **Role**: Ensures precision. Prevents inaccurate support/resistance lines caused by manual clicking offsets.

### 3.3 Hide All Drawings
* **Purpose**: Hides all active drawings on the overlay without deleting them.
* **Role**: Provides a clean view of indicators and candle data to verify clean price action.

### 3.4 Lock All Drawings
* **Purpose**: Disables dragging and editing for all placed drawings.
* **Role**: Prevents accidental displacement of trend lines and boundaries while panning or zooming the chart.

### 3.5 Show Favourites Rail
* **Purpose**: Filters the left tool rail to show only starred drawing tools.
* **Role**: Streamlines the workspace for traders who use only a few specific tools.

### 3.6 Right-Click Context Menu
* **Purpose**: Displays a popup menu at the coordinate of a right-clicked drawing.
* **Role**: Provides rapid access to Lock/Unlock, Hide, Delete, and Style Options for a selected drawing.

### 3.7 Drawing Style Editor
* **Purpose**: Controls drawing style properties (color, line width, fill opacity).
* **Role**: Allows color-coding (e.g., green for targets, red for stops) to keep analysis organized.

### 3.8 Drawing Undo / Redo
* **Purpose**: Supports undoing (Ctrl+Z) and redoing (Ctrl+Y / Ctrl+Shift+Z) drawing actions.
* **Role**: Restores state quickly after accidental edits or deletions.

---

## 4. Technical Indicators

### 4.1 SMA (Simple Moving Average)
* **Purpose**: Average of closing prices over a moving window of N periods.
* **Role**: Identifies long-term trend direction and acts as a dynamic support/resistance line.

### 4.2 EMA (Exponential Moving Average)
* **Purpose**: Moving average that applies more weight to recent prices.
* **Role**: Reduces lag, reacting faster to sudden price shifts. Used in moving average crossovers.

### 4.3 RSI (Relative Strength Index)
* **Purpose**: Oscillator measuring the speed and change of price movements between 0 and 100.
* **Role**: Identifies overbought (above 70) and oversold (below 30) conditions. Plotted in a sub-chart pane.

### 4.4 MACD (Moving Average Convergence Divergence)
* **Purpose**: Trend-following momentum indicator displaying the relationship between two EMAs, signal line, and a histogram.
* **Role**: Generates crossover signals and indicates momentum shifts. Plotted in a sub-chart pane.

### 4.5 Bollinger Bands
* **Purpose**: Draws a middle SMA band and two standard-deviation outer bands.
* **Role**: Identifies volatility compression (squeezes) and relative overbought/oversold levels.

### 4.6 VWAP (Volume Weighted Average Price)
* **Purpose**: Intraday benchmark calculating total price-volume divided by total volume, resetting at the daily boundary.
* **Role**: The standard institutional reference line. Used to determine if an asset is trading cheap or expensive intraday.

### 4.7 ATR (Average True Range)
* **Purpose**: Volatility oscillator measuring market range over a period.
* **Role**: Used to calculate stop-loss boundaries and position sizes based on current market volatility.

### 4.8 SuperTrend
* **Purpose**: Trend-following overlay showing buy/sell signals based on ATR and median price.
* **Role**: Popular intraday indicator in Indian markets. Colors the price line green (uptrend support) or red (downtrend resistance) with buy/sell triggers.

### 4.9 Stochastic Oscillator
* **Purpose**: Compares close price to high-low range over N periods.
* **Role**: Highly sensitive oscillator for identifying overbought/oversold conditions in range-bound markets.

### 4.10 Ichimoku Cloud (Ichimoku Kinko Hyo)
* **Purpose**: Comprehensive indicator displaying support/resistance, trend direction, and momentum via five lines (including Kumo Cloud).
* **Role**: Provides a complete trading framework in a single overlay.

### 4.11 Pivot Points (Standard/Fibonacci/Camarilla)
* **Purpose**: Support and resistance levels calculated from the previous period's high, low, and close.
* **Role**: Standard reference levels used by floor traders and market makers to identify price turning points.

---

## 5. UI Chrome & Navigation Options

### 5.1 OHLC Legend Bar
* **Purpose**: Legend displaying Open, High, Low, Close, Volume, and %Change values at the top-left of the chart.
* **Role**: Critical numerical readout that updates live as the crosshair moves or ticks arrive.

### 5.2 Floating Navigation Cluster
* **Purpose**: Cluster at the bottom-center of the chart containing Zoom In, Zoom Out, Scroll Left, Scroll Right, and Reset buttons.
* **Role**: Simplifies navigation on touch devices where pinch-to-zoom can be finicky.

### 5.3 Fullscreen Mode
* **Purpose**: Expands the chart engine viewport to occupy the full screen.
* **Role**: Removes browser/app chrome distraction during deep analysis.

### 5.4 Alert Gesture & Trigger Hook
* **Purpose**: Emits an `alertRequested` event when the user clicks the bell icon or double-clicks/presses a shortcut on the price axis.
* **Role**: Interface bridge allowing users to configure price alerts. The host app catches the event and manages notifications.

### 5.5 Layout Bookmarks (Save/Load)
* **Purpose**: Serializes complete chart layout (chart type, interval, drawings, indicators, theme, settings) to JSON.
* **Role**: Enables cloud sync and persistence across sessions, devices, and layouts.
