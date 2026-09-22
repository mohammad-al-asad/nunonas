declare module "*.png" {
  const value: any;
  export default value;
}

declare module "*.jpg" {
  const value: any;
  export default value;
}

declare module "*.jpeg" {
  const value: any;
  export default value;
}

declare module "*.webp" {
  const value: any;
  export default value;
}

declare module "*.avif" {
  const value: any;
  export default value;
}

declare module "*.svg" {
  import type React from "react";
  import type { SvgProps } from "react-native-svg";

  const content: React.FC<SvgProps>;
  export default content;
}

declare module "@expo/vector-icons" {
  export const Ionicons: any;
  export const MaterialIcons: any;
  export const MaterialCommunityIcons: any;
  export const Feather: any;
  export const AntDesign: any;
  export const Entypo: any;
  export const FontAwesome: any;
  export const FontAwesome5: any;
}

declare var module: any;
