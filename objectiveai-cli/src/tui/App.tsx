import { useState } from "react";
import { Menu, MenuResult } from "./Menu";
import { Config } from "./Config";
import { InventFlow } from "./Invent";
import { ParametersBuilder } from "../parameters";

type Route =
  | { name: "menu" }
  | { name: "invent"; spec: string; parameters: ParametersBuilder }
  | { name: "config" };

export function App() {
  const [route, setRoute] = useState<Route>({ name: "menu" });

  if (route.name === "config") {
    return <Config onBack={() => setRoute({ name: "menu" })} />;
  }

  if (route.name === "invent") {
    return (
      <InventFlow
        spec={route.spec}
        parameters={route.parameters}
        onBack={() => setRoute({ name: "menu" })}
      />
    );
  }

  return (
    <Menu
      onResult={(result: MenuResult) => {
        if (result.command === "config") {
          setRoute({ name: "config" });
        } else if (result.command === "invent") {
          setRoute({
            name: "invent",
            spec: result.spec,
            parameters: result.parameters,
          });
        }
      }}
    />
  );
}
