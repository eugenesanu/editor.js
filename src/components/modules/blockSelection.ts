/**
 * @class BlockSelection
 * @classdesc Manages Block selection with shortcut CMD+A
 *
 * @module BlockSelection
 * @version 1.0.0
 */
import Module from '../__module';
import _ from '../utils';
import Block from '../block';
import $ from '../dom';

import SelectionUtils from '../selection';

export default class BlockSelection extends Module {

  /**
   * Sanitizer Config
   * @return {SanitizerConfig}
   */
  private get sanitizerConfig() {
    return {
      p: {},
      h1: {},
      h2: {},
      h3: {},
      h4: {},
      h5: {},
      h6: {},
      ol: {},
      ul: {},
      li: {},
      br: true,
      img: {
        src: true,
        width: true,
        height: true,
      },
      a: {
        href: true,
      },
      b: {},
      i: {},
      u: {},
    };
  }

  /**
   * Flag that identifies all Blocks selection
   * @return {boolean}
   */
  public get allBlocksSelected(): boolean {
    const {BlockManager} = this.Editor;

    return BlockManager.blocks.every((block) => block.selected === true);
  }

  /**
   * Set selected all blocks
   * @param {boolean} state
   */
  public set allBlocksSelected(state: boolean) {
    const {BlockManager} = this.Editor;

    BlockManager.blocks.forEach((block) => block.selected = state);
  }

  /**
   * Flag that identifies any Block selection
   * @return {boolean}
   */
  public get anyBlockSelected(): boolean {
    const {BlockManager} = this.Editor;

    return BlockManager.blocks.some((block) => block.selected === true);
  }

  /**
   * Return selected Blocks array
   * @return {Block[]}
   */
  public get selectedBlocks(): Block[] {
    return this.Editor.BlockManager.blocks.filter((block: Block) => block.selected);
  }

  /**
   * SelectionUtils instance
   * @type {SelectionUtils}
   */
  private selection: SelectionUtils;

  /**
   * Module Preparation
   * Registers Shortcuts CMD+A and CMD+C
   * to select all and copy them
   */
  public prepare(): void {
    const {Shortcuts} = this.Editor;

    /** Selection shortcut */
    Shortcuts.add({
      name: 'CMD+A',
      handler: (event) => {
        const {BlockManager} = this.Editor;
        /**
         * When one page consist of two or more EditorJS instances
         * Shortcut module tries to handle all events. Thats why Editor's selection works inside the target Editor, but
         * for others error occurs because nothing to select.
         *
         * Prevent such actions if focus is not inside the Editor
         */
        if (!BlockManager.currentBlock) {
          return;
        }

        this.handleCommandA(event);
      },
    });

    this.selection = new SelectionUtils();
  }

  /**
   * Remove selection of Block
   * @param {number?} index - Block index according to the BlockManager's indexes
   */
  public unSelectBlockByIndex(index?) {
    const {BlockManager} = this.Editor;

    let block;

    if (isNaN(index)) {
      block = BlockManager.currentBlock;
    } else {
      block = BlockManager.getBlockByIndex(index);
    }

    block.selected = false;
  }

  /**
   * Clear selection from Blocks
   *
   * @param {Event} reason - event caused clear of selection
   * @param {boolean} restoreSelection - if true, restore saved selection
   */
  public clearSelection(reason?: Event, restoreSelection = false) {
    const {BlockManager, Caret, RectangleSelection} = this.Editor;

    /**
     * If reason caused clear of the selection was printable key and any block is selected,
     * remove selected blocks and insert pressed key
     */
    if (this.anyBlockSelected && reason && reason instanceof KeyboardEvent && _.isPrintableKey(reason.keyCode)) {
      const indexToInsert = BlockManager.removeSelectedBlocks();

      BlockManager.insertInitialBlockAtIndex(indexToInsert, true);
      Caret.setToBlock(BlockManager.currentBlock);
      _.delay(() => {
        Caret.insertContentAtCaretPosition(reason.key);
      }, 20)();
    }

    this.Editor.CrossBlockSelection.clear(reason);

    if (!this.anyBlockSelected || RectangleSelection.isRectActivated()) {
      this.Editor.RectangleSelection.clearSelection();
      return;
    }
  }

  /**
   * Reduce each Block and copy its content
   */
  public copySelectedBlocks(): void {
    const {Sanitizer} = this.Editor;
    const fakeClipboard = $.make('div');

    this.selectedBlocks.filter((block) => block.selected)
      .forEach((block) => {
        /**
         * Make <p> tag that holds clean HTML
         */
        const cleanHTML = Sanitizer.clean(block.holder.innerHTML, this.sanitizerConfig);
        const fragment = $.make('p');

        fragment.innerHTML = cleanHTML;
        fakeClipboard.appendChild(fragment);
      });

    _.copyTextToClipboard(fakeClipboard.innerHTML);
  }

  /**
   * select Block
   * @param {number?} index - Block index according to the BlockManager's indexes
   */
  public selectBlockByIndex(index?) {
    const {BlockManager} = this.Editor;

    /**
     * Remove previous focused Block's state
     */
    BlockManager.clearFocused();

    let block;

    if (isNaN(index)) {
      block = BlockManager.currentBlock;
    } else {
      block = BlockManager.getBlockByIndex(index);
    }

    /** Save selection */
    this.selection.save();
    SelectionUtils.get()
      .removeAllRanges();

    block.selected = true;
  }

  /**
   * First CMD+A Selects current focused blocks,
   * and consequent second CMD+A keypress selects all blocks
   *
   * @param {keydown} event
   */
  private handleCommandA(event): void {
    this.Editor.RectangleSelection.clearSelection();

    /** Prevent default selection */
    event.preventDefault();

    this.selectAllBlocks();
  }

  /**
   * Select All Blocks
   * Each Block has selected setter that makes Block copyable
   */
  private selectAllBlocks() {
    this.allBlocksSelected = true;
  }
}
