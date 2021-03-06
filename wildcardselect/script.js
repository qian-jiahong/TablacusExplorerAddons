var Addon_Id = "wildcardselect";

var item = GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "Edit");
	item.setAttribute("MenuPos", -1);

	item.setAttribute("KeyOn", "List");
	item.setAttribute("Key", "Ctrl+Shift+S");
	item.setAttribute("MouseOn", "List");
}
if (window.Addon == 1) {
	Addons.WildcardSelect =
	{
		strName: item.getAttribute("MenuName") || GetText(GetAddonInfo(Addon_Id).Name),

		Exec: function (Ctrl, pt)
		{
			try {
				var FV = GetFolderView(Ctrl, pt);
				if (FV && FV.Items) {
					var s = InputDialog(Addons.WildcardSelect.strName, "");
					if (s) {
						for (var i = FV.Items.Count; i-- > 0;) {
							var FolderItem = FV.Items.Item(i);
							if (PathMatchEx(fso.GetFileName(FolderItem.Path), s)) {
								FV.SelectItem(FolderItem, SVSI_SELECT);
							}
						}
					}
				}
			} catch (e) {
				wsh.Popup(e.description, 0, TITLE, MB_ICONEXCLAMATION);
			}
			return S_OK;
		}
	}

	//Menu
	if (item.getAttribute("MenuExec")) {
		Addons.WildcardSelect.nPos = api.LowPart(item.getAttribute("MenuPos"));
		AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos, Selected, item)
		{
			api.InsertMenu(hMenu, Addons.WildcardSelect.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Addons.WildcardSelect.strName);
				ExtraMenuCommand[nPos] = Addons.WildcardSelect.Exec;
			return nPos;
		});
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.WildcardSelect.Exec, "Func");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.WildcardSelect.Exec, "Func");
	}

	AddTypeEx("Add-ons", "Wildcard Select...", Addons.WildcardSelect.Exec);
}
