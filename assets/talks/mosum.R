'''
XQuartz:https://www.xquartz.org/
mosum
R version 4.4.3 support Tcl/Tk / check in R terminal: capabilities("tcltk")
'''

'''
# (Construct Piecewise stationary time series)
library(mosum)
td <- testData(model = "mix", seed = 1234)
plot(ts(td$x), col = "darkgray")
lines(td$mu, col = 2, lty = 2, lwd = 2)
'''

'''
1.MOSUM procedure with a single bandwidth
mosum(x, G, G.right = G,
  var.est.method = c("mosum", "mosum.min", "mosum.max", "custom")[1],
  var.custom = NULL,  boundary.extension = TRUE,
  threshold = c("critical.value", "custom")[1], alpha = 0.1,
  threshold.custom = NULL, criterion = c("eta", "epsilon")[1],
  eta = 0.4, epsilon = 0.2, do.confint = FALSE, level = 0.05, N_reps = 1000)
'''
m <- mosum(Nile, G = 20,  alpha = 0.05)
par(mfcol = c(2, 1), mar = c(4, 2.5, 2.5, 0.5))
plot(m, display = "data")
plot(m, display = "mosum")

summary(m)

'''
# 2.Multiscale MOSUM procedure with bottom-up merging.
multiscale.bottomUp(x, G = bandwidths.default(length(x),
  G.min = max(20, ceiling(0.05*length(x)))),
  threshold = c("critical.value", "custom")[1],
  alpha = 0.1, threshold.function = NULL, eta = 0.4,
  do.confint = FALSE, level = 0.05, N_reps = 1000, ...)
'''
# 1)normal time series of length n = 600 with mean changes at time points k1 = 50,k2 = 100,k3 = 300 of size d1 = 1,d2 = 2 and d3 = −3
td2 <- testData(lengths = c(50, 50, 200, 300),
                means = c(0, 1, 3, 0),
                sds = rep(1, 4),
                seed = 123)
plot(ts(td2$x))
x <- td2$x
# 2)bandwidth set G = {30, 50, 80, 130}
mbu <- multiscale.bottomUp(x, G = c(30, 50, 80, 130))
print(mbu$cpts)
print(mbu$pooled.cpts)
#The output K = {50, 100, 300} of the algorithm coincides with the true change-points, 
#whereas the candidate set before merging P contains an additional estimate 96 which is a duplicate estimate for k2 = 100.

'''
# 3.Multiscale MOSUM procedure with localized pruning.
multiscale.localPrune(x, G = bandwidths.default(length(x)),
                      max.unbalance = 4, threshold = c("critical.value", "custom")[1],
                      alpha = 0.1, threshold.function = NULL,
                      criterion = c("eta", "epsilon")[1], eta = 0.4, epsilon = 0.2,
                      rule = c("pval", "jump")[1], penalty = c("log", "polynomial")[1],
                      pen.exp = 1.01, do.confint = FALSE, level = 0.05, N_reps = 1000, ...)
'''

mlp <- multiscale.localPrune(x, G = c(30, 50, 80, 130))
print(mlp$cpts)
print(mlp$pooled.cpts)

#As the example shows, the initial candidate set P considered by Algorithm 2 tends to be larger than that considered by Algorithm 1 due to the use of asymmetric bandwidths.
#The localized merging algorithm is successful in removing any spurious or duplicate estimates and returns K that correctly estimates all the change-points.

'''
#Bandwidth generation：The default option for generating bandwidths for the multiscale MOSUM procedure is the function
bandwidths.default(n, d.min = 10, G.min = 10, G.max = min(n/2, n^(2/3)))
#This function automatically generates a reasonable and gradually increasing set of bandwidths for you, facilitating multi-scale change point detection.
'''

# 4.Bootstrap confidence intervals
mlp_ci <- confint(mlp, level = 0.05, N_reps = 1000)
print(mlp_ci$CI)

plot(mlp, display = "data", shaded = "CI", CI = "unif", level = 0.1)
summary(mlp) 

# 5.An Emprical Example: Quarterly US ex-post real interest rate from 1961:Q1 to 1986:Q3
data("RealInt", package = "strucchange")
ls
head(RealInt)
mlp_emprical <- multiscale.localPrune(RealInt, alpha = 0.1, eta = 0.4,
                            var.est.method = "mosum.max", penalty = "log", pen.exp = 1.01)
print(mlp_emprical)
summary(mlp_emprical)
par(mfrow = c(4, 1), mar = c(2, 4, 2, 2))
plot(mlp_emprical, display = "data", shaded = "CI", CI = "unif", level = 0.1)
plot(mlp_emprical, display = "significance",  shaded = "bandwidth")
plot(mlp_emprical, display = "significance",  shaded = "CI", CI = "pw")
plot(mlp_emprical, display = "significance",  shaded = "CI", CI = "unif")






