// Adopts the UIScene life cycle on iOS.
//
// Apps built with the iOS 27 SDK are terminated at launch on iOS 27 unless they use scenes
// (UIKit asserts in _UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption). Expo SDK 54's
// AppDelegate template still creates its window in didFinishLaunching, so this plugin:
//   1. declares a single-window scene manifest in Info.plist, and
//   2. moves window creation and React Native start-up into a SceneDelegate, forwarding deep links
//      (which iOS now delivers to the scene, not the app delegate) to the existing AppDelegate.
const { withAppDelegate, withInfoPlist } = require("expo/config-plugins");

const WINDOW_START = /\n[ \t]*window = UIWindow\(frame: UIScreen\.main\.bounds\)\n[ \t]*factory\.startReactNative\(\s*withModuleName: "main",\s*in: window,\s*launchOptions: launchOptions\)\n/;
const MARKER = "// @scene-lifecycle";

const SCENE_DELEGATE = `
${MARKER}: the window and React Native start here, once iOS connects the app's scene.
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene,
          let appDelegate = UIApplication.shared.delegate as? AppDelegate,
          let factory = appDelegate.reactNativeFactory else { return }

    let window = UIWindow(windowScene: windowScene)
    self.window = window
    // Code that reads the app delegate's window (as before scenes) still finds it.
    appDelegate.window = window

    // A cold start from a link arrives here instead of in launchOptions, so pass it on for Linking.getInitialURL().
    var launchOptions: [UIApplication.LaunchOptionsKey: Any] = [:]
    if let url = connectionOptions.urlContexts.first?.url {
      launchOptions[.url] = url
    }
    factory.startReactNative(withModuleName: "main", in: window, launchOptions: launchOptions)
  }

  // Links opened while the app is running.
  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    guard let appDelegate = UIApplication.shared.delegate as? AppDelegate else { return }
    for context in URLContexts {
      var options: [UIApplication.OpenURLOptionsKey: Any] = [:]
      if let source = context.options.sourceApplication {
        options[.sourceApplication] = source
      }
      _ = appDelegate.application(UIApplication.shared, open: context.url, options: options)
    }
  }

  // Universal links.
  func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    guard let appDelegate = UIApplication.shared.delegate as? AppDelegate else { return }
    _ = appDelegate.application(UIApplication.shared, continue: userActivity, restorationHandler: { _ in })
  }
}
`;

function withSceneManifest(config) {
  return withInfoPlist(config, (mod) => {
    mod.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: "Default Configuration",
            UISceneDelegateClassName: "$(PRODUCT_MODULE_NAME).SceneDelegate",
          },
        ],
      },
    };
    return mod;
  });
}

function withSceneDelegate(config) {
  return withAppDelegate(config, (mod) => {
    if (mod.modResults.language !== "swift") {
      throw new Error("withIosSceneLifecycle: expected a Swift AppDelegate.");
    }
    let contents = mod.modResults.contents;
    if (contents.includes(MARKER)) return mod; // already applied

    if (!WINDOW_START.test(contents)) {
      throw new Error(
        "withIosSceneLifecycle: the AppDelegate template changed; could not find where it creates the window.",
      );
    }
    contents = contents.replace(
      WINDOW_START,
      `\n    ${MARKER}: the window and React Native start in SceneDelegate (below).\n`,
    );
    mod.modResults.contents = `${contents.trimEnd()}\n${SCENE_DELEGATE}`;
    return mod;
  });
}

module.exports = function withIosSceneLifecycle(config) {
  return withSceneDelegate(withSceneManifest(config));
};
