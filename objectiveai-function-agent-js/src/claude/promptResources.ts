export function promptResources(resources: string[]): string {
  let prompt = "Resources:\n";
  for (const resource of resources) {
    prompt += `- ${resource}\n`;
  }
  return prompt;
}
