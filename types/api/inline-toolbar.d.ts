/**
 * Describes InlineToolbar API methods
 */
export interface InlineToolbar {
    /**
     * Closes InlineToolbar
     */
    close(): void;
  
    /**
     * Opens InlineToolbar
     */
    open(): void;

    /**
     * Toggles buttons row
     */
    toggleButtons(visible: boolean): void;
}
  