// Raises every CocoaPods target to at least iOS 15.1.
//
// Xcode 27 refuses to build targets below iOS 15 ("deployment target ... is set to 12.4, but the range
// of supported deployment target versions is 15.0 to 27.x"). Some pods still declare older targets for
// their resource bundles (RNSVG, AsyncStorage), which fails the whole build.
const fs = require("fs");
const path = require("path");
const { withDangerousMod } = require("expo/config-plugins");

const MINIMUM = "15.1";
const MARKER = "# @pods-minimum-deployment-target";

const SNIPPET = `
    ${MARKER}: Xcode 27 rejects pod targets below iOS 15.
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |build_config|
        current = build_config.build_settings["IPHONEOS_DEPLOYMENT_TARGET"]
        if current.nil? || current.to_f < ${MINIMUM}
          build_config.build_settings["IPHONEOS_DEPLOYMENT_TARGET"] = "${MINIMUM}"
        end
      end
    end`;

module.exports = function withPodsMinimumDeploymentTarget(config) {
  return withDangerousMod(config, [
    "ios",
    async (mod) => {
      const podfilePath = path.join(mod.modRequest.platformProjectRoot, "Podfile");
      let podfile = fs.readFileSync(podfilePath, "utf8");
      if (podfile.includes(MARKER)) return mod;

      // Insert right after the react_native_post_install(...) call inside post_install.
      const anchor = /(react_native_post_install\([\s\S]*?\n\s*\))/;
      if (!anchor.test(podfile)) {
        throw new Error("withPodsMinimumDeploymentTarget: could not find react_native_post_install in the Podfile.");
      }
      podfile = podfile.replace(anchor, `$1\n${SNIPPET}`);
      fs.writeFileSync(podfilePath, podfile);
      return mod;
    },
  ]);
};
