# Cannon Lab ⭐

Cannon Lab is an interactive projectile-motion simulator built with p5.js. Adjust the launch conditions, compare two physics models, and test whether a shot reaches its target.

## CONGRESSIONAL APP CHALLENGE

This website will be submitted for the Congressional App Challenge for District 1 of Ohio

## What you can explore

- Compare an ideal trajectory with a quadratic air-drag model. The selected model is shown as a solid line; the other model is dashed.
- Change launch speed, launch angle, wind acceleration, gravity, and drag coefficient.
- Follow the projectile's trail and velocity arrow while watching its range, height, peak, speed, and time update.
- Move, hide, or reset the castle target, and add a vertical coordinate reference line.
- Pause a shot and resume it. Shot settings stay fixed until it lands so the forecast and comparison remain consistent.

## Try this experiment

1. Select **Ideal**, set the launch angle to **45°**, and fire.
2. Note the predicted range and the height at the peak.
3. Select **Air drag** and fire with the same settings.
4. Compare the solid and dashed paths and the two predicted ranges.
5. Change the angle or wind, then repeat and describe what changed.

The 45° result is a useful starting point for ideal motion on level ground with no wind. Air drag, wind, and launch height change the result.

## Run the simulator

SIMPLY GO TO https://naah51.github.io/cannon-simulator/

## Controls

| Control | Description |
| --- | --- |
| Launch speed | Initial speed in meters per second. Range: 0–300. |
| Launch angle | Direction above horizontal in degrees. Range: 0–90. |
| Wind acceleration | Horizontal acceleration in meters per second squared. Positive values push right. Range: −100 to 100. |
| Gravity | Downward acceleration in meters per second squared. Range: 0.1–50. |
| Drag coefficient k | Strength of the air-resistance model. Range: 0–1; used by **Air drag**. |
| Model | Choose **Ideal** or **Air drag**. |
| Reference line | Enter `X,Y` in meters and select **Add Line** to mark a vertical coordinate. |
| Castle target | Enter `X,Y` in meters and select **Move Castle**. Horizontal position can be 0–2500 m; height can be 0–1000 m. |
| Pause / Resume | Pause or continue the current shot. |
| Run | Fire with the current settings. |

The first coordinate is horizontal distance; the second is height. For example, `50,0` places the target 50 meters from the cannon at ground level.

## Physics model

The ideal model updates the projectile using launch velocity, horizontal wind acceleration, and gravity. Its equations are:

```text
x(t) = x₀ + vₓ₀t + ½a_wt²
y(t) = y₀ + vᵧ₀t − ½gt²
```

The air-drag model adds a resistance force opposite the projectile's motion, proportional to speed squared. Its coefficient is a teaching control rather than a calibrated value for a particular cannonball or atmosphere.

The displayed forecast uses the same selected model and settings as the shot. The dashed path and “Other model” readout show what the alternate model predicts under the same launch conditions.

FOR ANY ISSUES PLEASE LEAVE AN EMAIL ON ishaanjadhav@outlook.com
