import { Node } from "../../mung/Node";
import { useState } from "react";
import { Surface } from "./Surface";
import { SelectedNodeStore } from "./SelectedNodeStore";
import { LeftPane } from "./LeftPane";
import { RightPane } from "./RightPane";
import { ClassVisibilityStore } from "./ClassVisibilityStore";

export interface ExplorerProps {
  readonly nodes: Node[];
}

export function Explorer(props: ExplorerProps) {
  const [selectedNodeStore, _] = useState<SelectedNodeStore>(
    () => new SelectedNodeStore(),
  );

  const [classVisibilityStore, __] = useState<ClassVisibilityStore>(
    () => new ClassVisibilityStore(),
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        justifyItems: "stretch",
        height: "100%",
      }}
    >
      <LeftPane
        nodes={props.nodes}
        selectedNodeStore={selectedNodeStore}
        classVisibilityStore={classVisibilityStore}
      />
      <div
        style={{
          flexGrow: 1,
        }}
      >
        <Surface
          nodes={props.nodes}
          selectedNodeStore={selectedNodeStore}
          classVisibilityStore={classVisibilityStore}
        />
      </div>
      <RightPane nodes={props.nodes} selectedNodeStore={selectedNodeStore} />
    </div>
  );
}
