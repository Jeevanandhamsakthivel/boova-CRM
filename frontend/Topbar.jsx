import { GlobalSearch } from "./GlobalSearch";
import { NotificationsDropdown } from "./NotificationsDropdown";
import { UserMenu } from "./UserMenu";

export function Topbar() {
  return (
    <header className="app-topbar">
      <GlobalSearch />
      <div className="topbar-actions">
        <NotificationsDropdown />
        <UserMenu />
      </div>
    </header>
  );
}