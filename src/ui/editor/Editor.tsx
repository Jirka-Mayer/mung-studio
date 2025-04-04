import { Node } from "../../mung/Node";
import { useState } from "react";
import { SceneView } from "./scene-view/SceneView";
import { SelectedNodeStore } from "./state/SelectedNodeStore";
import { OverviewPanel } from "./OverviewPanel";
import { InspectorPanel } from "./InspectorPanel";
import { ClassVisibilityStore } from "./state/ClassVisibilityStore";
import { NotationGraphStore } from "./state/notation-graph-store/NotationGraphStore";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import Stack from "@mui/joy/Stack";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { EditorStateStore } from "./state/EditorStateStore";
import { DisplayModeButtons } from "./DisplayModeButtons";

export interface EditorProps {
  /**
   * When the <Editor> component is created, it uses this value to
   * initialize its internal state. Then this value is ignored.
   */
  readonly initialNodes: Node[];

  /**
   * The scanned music document image URL,
   * if null, then no image is displayed.
   */
  readonly backgroundImageUrl: string | null;

  /**
   * Callback triggered, when the user wants to leave the editor.
   */
  readonly onClose: () => void;
}

/**
 * The root component for editing/vieweing a single mung document.
 * Contains the scene view, overview panel and the inspector panel
 * plus additional minor sub-components.
 *
 * It is self-contained, meaning you can have two instances of this component,
 * that could edit two different mung documents.
 */
export function Editor(props: EditorProps) {
  const [notationGraphStore, _1] = useState<NotationGraphStore>(
    () => new NotationGraphStore(props.initialNodes, null),
  );

  const [selectedNodeStore, _2] = useState<SelectedNodeStore>(
    () => new SelectedNodeStore(notationGraphStore),
  );

  const [classVisibilityStore, _3] = useState<ClassVisibilityStore>(
    () => new ClassVisibilityStore(),
  );

  const [editorStateStore, _4] = useState<EditorStateStore>(
    () => new EditorStateStore(),
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyItems: "stretch",
        height: "100%",
      }}
    >
      <Sheet
        variant="soft"
        sx={{
          p: 1,
          borderBottom: "1px solid var(--joy-palette-neutral-300)",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <Button
            variant="outlined"
            startDecorator={<ArrowBackIcon />}
            onClick={() => props.onClose()}
          >
            Close File
          </Button>
          <Typography level="body-lg" sx={{ fontWeight: 700 }}>
            MuNG Studio
          </Typography>
          <DisplayModeButtons editorStateStore={editorStateStore} />
        </Stack>
      </Sheet>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyItems: "stretch",
          overflow: "hidden",
          flexGrow: 1,
        }}
      >
        <OverviewPanel
          notationGraphStore={notationGraphStore}
          selectedNodeStore={selectedNodeStore}
          classVisibilityStore={classVisibilityStore}
          editorStateStore={editorStateStore}
        />
        <Box
          sx={{
            flexGrow: 1,
          }}
        >
          <SceneView
            backgroundImageUrl={props.backgroundImageUrl}
            notationGraphStore={notationGraphStore}
            selectedNodeStore={selectedNodeStore}
            classVisibilityStore={classVisibilityStore}
            editorStateStore={editorStateStore}
          />
        </Box>
        <InspectorPanel
          notationGraphStore={notationGraphStore}
          selectedNodeStore={selectedNodeStore}
        />
      </Box>
    </Box>
  );
}
