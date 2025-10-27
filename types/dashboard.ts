/**
 * Props for the main Dashboard component.
 * 
 * @property onBackToHome - (optional) Callback to return to the home view.
 */
export interface DashboardProps {
  /**
   * Optional callback triggered when the user wants to go back to the home page.
   */
  onBackToHome?: () => void;
}
