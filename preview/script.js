var Addon_Id = "preview";

if (window.Addon == 1) {
	Addons.Preview = 
	{	
		tid: null,
		Align: api.strcmpi(GetAddonOption(Addon_Id, "Align"), "Right") ? "Left" : "Right",
		Width: 0,

		Arrange: function (Item)
		{
			Addons.Preview.Item = Item;
			var o = document.getElementById('PreviewBar');
			var s = [];
			if (Item) {
				var Folder = sha.NameSpace(Item.Parent);
				var info = [Folder.GetDetailsOf(Item, 0), "<br />"];
				var nSize = Item.ExtendedProperty("Size");
				if (nSize) {
					info.push(api.StrFormatByteSize(nSize));
				}
				if (Item.IsLink) {
					Item = api.ILCreateFromPath(Item.GetLink.Path);
				}
				var nWidth = 0, nHeight = 0;
				var s1 = Item.ExtendedProperty("{6444048f-4c8b-11d1-8b70-080036b11a03} 13");
				if (s1) {
					info.push(' (' + s1 + ')');
					nWidth = Item.ExtendedProperty("{6444048f-4c8b-11d1-8b70-080036b11a03} 3");
					nHeight = Item.ExtendedProperty("{6444048f-4c8b-11d1-8b70-080036b11a03} 4");
				}
				var style;
				if (nWidth  > nHeight) {
					style = ["width: ", this.Width, "px; height: ", this.Width * nHeight / nWidth, "px"];
				} else {
					style = ["width: ", this.Width * nWidth / nHeight, "px; height: ", this.Width, "px"];
				}
				if (nWidth && nHeight) {
					s.splice(s.length, 0, '<img src="', Item.Path, '" title="', Folder.GetDetailsOf(Item, 0), "\n", Folder.GetDetailsOf(Item, -1), '" style="display: block;', style.join(""), '" onerror="this.style.display=\'none\'" oncontextmenu="Addons.Preview.Popup(this); return false;" ondrag="Addons.Preview.Drag(); return false">');
				}
				s.splice(s.length, 0, '<div style="font-size: 10px; margin: 0px 4px">', info.join(""), '</div>');
			}
			else {
				s.push('<div style="font-size: 10px; margin-left: 4px">Preview</div>');
			}
			o.innerHTML = s.join("");
			Resize2();
		},

		Popup: function (o)
		{
			if (Addons.Preview.Item) {
				var hMenu = api.CreatePopupMenu();
				var ContextMenu = api.ContextMenu(Addons.Preview.Item);
				if (ContextMenu) {
					ContextMenu.QueryContextMenu(hMenu, 0, 1, 0x7FFF, CMF_NORMAL);
					var pt = api.Memory("POINT");
					api.GetCursorPos(pt);
					var nVerb = api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, te.hwnd, null, ContextMenu);
					if (nVerb) {
						ContextMenu.InvokeCommand(0, te.hwnd, nVerb - 1, null, null, SW_SHOWNORMAL, 0, 0);
					}
				}
				api.DestroyMenu(hMenu);
			}
		},

		Drag: function ()
		{
			var pdwEffect = api.Memory("DWORD");
			pdwEffect.X = DROPEFFECT_COPY | DROPEFFECT_MOVE | DROPEFFECT_LINK;
			api.DoDragDrop(Addons.Preview.Item, pdwEffect.X, pdwEffect);
		},
		
		Init: function ()
		{
			this.Width = te.Data["Conf_" + this.Align + "BarWidth"];
			if (!this.Width) {
				this.Width = 178;
				te.Data["Conf_" + Addons.Preview.Align + "BarWidth"] = this.Width;
			}
			var s = '<div id="PreviewBar" style="width: 100%; height: 100%; background-color: window; border: 1px solid WindowFrame; overflow-x: hidden; overflow-y: hidden;"></div>';
			SetAddon(Addon_Id, this.Align + "Bar3", s);
			this.Arrange();
		}
	}

	Addons.Preview.Init();

	AddEvent("SelectionChanged", function (Ctrl)
	{
		if (Ctrl.Type <= CTRL_EB) {
			if (Addons.Preview.Width && !document.getElementById('PreviewBar').style.display.match(/none/i)) {
				if (Addons.Preview.tid) {
					clearTimeout(Addons.Preview.tid);
				}
				if (Ctrl.ItemCount(SVGIO_SELECTION) == 1) {
					(function (Item) { Addons.Preview.tid = setTimeout(function () {
						Addons.Preview.Arrange(Item);
					}, 500);}) (Ctrl.SelectedItems().Item(0));
				}
			}
		}
	});
}

