export const profileBuilderRolloutEnabled =
  import.meta.env.VITE_PROFILE_BUILDER_ROLLOUT !== "false";

export const profileCreationPath = profileBuilderRolloutEnabled
  ? "/builder"
  : "/questionnaire";
