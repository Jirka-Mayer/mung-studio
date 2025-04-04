import { atom, Atom, getDefaultStore } from "jotai";
import { NodeCollection } from "./NodeCollection";
import { Node } from "../../../../mung/Node";
import { BulkActionLayer } from "./BulkActionLayer";
import { Link } from "../../../../mung/Link";
import { LinkWithNodes } from "../../../../mung/LinkWithNodes";
import { LinksIndex } from "./LinksIndex";
import { LinkType } from "../../../../mung/LinkType";
import { JotaiStore } from "../JotaiStore";
import { GraphStructureSignalAtoms } from "./GraphStructureSignalAtoms";
import { NodeAtom, NodeAtomsView } from "./NodeAtomsView";
import { LinkAtomsView } from "./LinkAtomsView";
import { ClassNameCounts, ClassNamesIndex } from "./ClassNamesIndex";
import { SignalAtomWrapper } from "../SignalAtomWrapper";

/**
 * Stores the Music Notation Graph (MuNG) data and provides convenient
 * access to React and vanilla javascript for both ease of use and performance.
 */
export class NotationGraphStore {
  /**
   * Jotai store that holds atom values
   */
  private readonly jotaiStore: JotaiStore;

  /**
   * The ground-truth data layer.
   * Contains a list of nodes analogous to the mung XML file.
   */
  private nodeCollection: NodeCollection;

  // provide access to links as "lists-of-links"
  // (there is no such thing in reality, only nodes and inlink+outlink ids)
  private allLinksIndex: LinksIndex;
  private syntaxLinksIndex: LinksIndex;
  private precedenceLinksIndex: LinksIndex;

  private classNamesIndex: ClassNamesIndex;

  private bulkActionLayer: BulkActionLayer;

  // react connectors
  private graphStructureSignalAtoms: GraphStructureSignalAtoms;
  private nodeAtomsView: NodeAtomsView;
  private linkAtomsView: LinkAtomsView;

  constructor(initialNodes: Node[], jotaiStore: JotaiStore | null) {
    this.jotaiStore = jotaiStore ?? getDefaultStore();

    // === create all data-handling services ===

    this.nodeCollection = new NodeCollection();

    this.allLinksIndex = new LinksIndex(null, this.nodeCollection);
    this.syntaxLinksIndex = new LinksIndex(
      LinkType.Syntax,
      this.nodeCollection,
    );
    this.precedenceLinksIndex = new LinksIndex(
      LinkType.Precedence,
      this.nodeCollection,
    );

    this.classNamesIndex = new ClassNamesIndex(this.nodeCollection);

    this.bulkActionLayer = new BulkActionLayer(
      this.nodeCollection,
      this.allLinksIndex,
    );

    // === boot up the react interface machinery ===

    this.graphStructureSignalAtoms = new GraphStructureSignalAtoms(
      this.nodeCollection,
      this.jotaiStore,
    );
    this.nodeAtomsView = new NodeAtomsView(
      this.nodeCollection,
      this.jotaiStore,
    );
    this.linkAtomsView = new LinkAtomsView(
      this.nodeCollection,
      this.allLinksIndex,
      this.jotaiStore,
    );
    this.classNamesIndex.onChange.subscribe(() => {
      this.classNamesChangeSignalAtom.signal(this.jotaiStore.set);
    });

    // === insert initial data ===

    this.setAllNodes(initialNodes);
  }

  //////////////////////////
  // Javascript Nodes API //
  //////////////////////////

  /**
   * Read-only view of all nodes in the graph
   */
  public get nodes(): readonly Node[] {
    return this.nodeCollection.getAllNodes();
  }

  /**
   * Read-only view of all node IDs in te graph
   */
  public get nodeIds(): readonly number[] {
    return this.nodeCollection.getAllNodeIds();
  }

  /**
   * Checks, whether the given node ID exists.
   */
  public hasNode(nodeId: number): boolean {
    return this.nodeCollection.hasNode(nodeId);
  }

  /**
   * Fetches a node by its id. Fails if no such node exists.
   */
  public getNode(nodeId: number): Node {
    return this.nodeCollection.getNode(nodeId);
  }

  /**
   * Sets all nodes (and thus also links) in the store,
   * completely overwriting its current contents.
   */
  public setAllNodes(nodes: Node[]) {
    // TODO: this must be more gentle as it is used to navigate through
    // the history and so something faster must be used instead
    // (something that only emits change events for what has actually changed)
    this.bulkActionLayer.clear();
    this.bulkActionLayer.insertManyNodes(nodes);
  }

  /////////////////////
  // React Nodes API //
  /////////////////////

  /**
   * Read-only atom that exposes the list of existing node IDs
   */
  public readonly nodeIdsAtom: Atom<readonly number[]> = atom((get) => {
    this.graphStructureSignalAtoms.whenNodesChange.subscribe(get);
    return this.nodeIds;
  });

  /**
   * Returns writable atom that provides access to the state of a single node.
   * The requested nodeId must exist already. Modifications to node ID or
   * links are not allowed via this atom.
   */
  public getNodeAtom(nodeId: number): NodeAtom {
    return this.nodeAtomsView.getNodeAtom(nodeId);
  }

  //////////////////////////
  // Javascript Links API //
  //////////////////////////

  /**
   * Read-only view of all links in the graph (both syntax and precendence)
   */
  public get links(): readonly Link[] {
    return this.allLinksIndex.getAllLinks();
  }

  /**
   * Read-only view of all syntax links in the graph
   */
  public get syntaxLinks(): readonly Link[] {
    return this.syntaxLinksIndex.getAllLinks();
  }

  /**
   * Read-only view of all precedence links in the graph
   */
  public get precedenceLinks(): readonly Link[] {
    return this.precedenceLinksIndex.getAllLinks();
  }

  /**
   * Fetches terminal nodes for a given link
   */
  public getLinkWithNodes(link: Link): LinkWithNodes {
    return this.allLinksIndex.getLinkWithNodes(link);
  }

  /**
   * Returns true if the given link exists
   */
  public hasLink(fromId: number, toId: number, type: LinkType) {
    return this.allLinksIndex.hasLink({
      fromId,
      toId,
      type,
    });
  }

  /**
   * Inserts a new link into the graph.
   */
  public insertLink(fromId: number, toId: number, type: LinkType) {
    this.nodeCollection.insertLink(fromId, toId, type);
  }

  /**
   * Removes a link from the graph.
   */
  public removeLink(fromId: number, toId: number, type: LinkType) {
    this.nodeCollection.removeLink(fromId, toId, type);
  }

  /**
   * If a link exists, it gets removed, if missing, it gets inserted.
   */
  public toggleLink(fromId: number, toId: number, type: LinkType) {
    if (this.hasLink(fromId, toId, type)) {
      this.removeLink(fromId, toId, type);
    } else {
      this.insertLink(fromId, toId, type);
    }
  }

  /////////////////////
  // React Links API //
  /////////////////////

  /**
   * Read-only atom that exposes the list of all links
   * (both syntax and precedence)
   */
  public readonly linksAtom: Atom<readonly Link[]> = atom((get) => {
    this.graphStructureSignalAtoms.whenLinksChange.subscribe(get);
    return this.links;
  });

  /**
   * Read-only atom that exposes the list of all syntax links
   */
  public readonly syntaxLinksAtom: Atom<readonly Link[]> = atom((get) => {
    this.graphStructureSignalAtoms.whenSyntaxLinksChange.subscribe(get);
    return this.syntaxLinks;
  });

  /**
   * Read-only atom that exposes the list of all precedence links
   */
  public readonly precedenceLinksAtom: Atom<readonly Link[]> = atom((get) => {
    this.graphStructureSignalAtoms.whenPrecedenceLinksChange.subscribe(get);
    return this.precedenceLinks;
  });

  /**
   * Returns a read-only atom that exposes a given link with both of its nodes
   */
  public getLinkWithNodesAtom(link: Link): Atom<LinkWithNodes> {
    return this.linkAtomsView.getLinkWithNodesAtom(link);
  }

  ////////////////////////////////
  // Javascript Class Names API //
  ////////////////////////////////

  /**
   * Read-only view of all class names in the graph
   */
  public get classNames(): readonly string[] {
    return this.classNamesIndex.getClassNames();
  }

  /**
   * Read-only view of counts of individual class names in the graph
   */
  public get classNameCounts(): ClassNameCounts {
    return this.classNamesIndex.getClassNameCounts();
  }

  ///////////////////////////
  // React Class Names API //
  ///////////////////////////

  private classNamesChangeSignalAtom = new SignalAtomWrapper();

  /**
   * Read-only atom that exposes the list of existing node class names
   */
  public readonly classNamesAtom: Atom<readonly string[]> = atom((get) => {
    this.classNamesChangeSignalAtom.subscribe(get);
    return this.classNames;
  });

  /**
   * Read-only atom that exposes counts for each node class in the graph.
   */
  public readonly classNameCountsAtom: Atom<ClassNameCounts> = atom((get) => {
    this.classNamesChangeSignalAtom.subscribe(get);
    return this.classNameCounts;
  });
}
