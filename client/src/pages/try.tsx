import { Redirect } from "wouter";
import BuilderPage from "./builder";
import { profileBuilderRolloutEnabled } from "@/lib/profile-builder-rollout";

export default function TryPage() {
  return profileBuilderRolloutEnabled ? <BuilderPage /> : <Redirect to="/register" />;
}
