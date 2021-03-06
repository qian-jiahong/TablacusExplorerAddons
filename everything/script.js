var Addon_Id = "everything";
var Default = "ToolBar2Right";

var item = await GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.Everything =
	{
		PATH: "es:",
		iCaret: -1,
		strName: item.getAttribute("MenuName") || "Everything",
		Max: 1000,
		RE: false,
		fncb: {},
		nDog: 0,
		Subfolders: GetNum(item.getAttribute("Subfolders")) ? 1 : 0,
		NewTab: GetNum(item.getAttribute("NewTab")),
		RE: GetNum(item.getAttribute("RE")),

		KeyDown: function (ev) {
			setTimeout(Addons.Everything.ShowButton, 99);
			if (ev.keyCode == VK_RETURN || window.chrome && /^Enter/i.test(ev.key)) {
				Addons.Everything.Search();
				return false;
			}
		},

		Search: async function (s) {
			var FV = await te.Ctrl(CTRL_FV);
			var s = s || document.F.everythingsearch.value;
			if (s.length) {
				if (!/path:.+/.test(s) && ((await api.GetAsyncKeyState(VK_SHIFT) < 0 ? 1 : 0) ^ Addons.Everything.Subfolders)) {
					var path = await FV.FolderItem.Path;
					if (/^[A-Z]:\\|^\\\\/i.test(path)) {
						s += " path:" + (await api.PathQuoteSpaces((path + "\\")).replace(/\\\\$/, "\\"));
					}
				}
				FV.Navigate(Addons.Everything.PATH + s, Addons.Everything.NewTab ? SBSP_NEWBROWSER : SBSP_SAMEBROWSER);
			}
		},

		Focus: function (o) {
			o.select();
			if (this.iCaret >= 0) {
				var range = o.createTextRange();
				range.move("character", this.iCaret);
				range.select();
				this.iCaret = -1;
			}
			Addons.Everything.ShowButton();
		},

		Clear: function () {
			document.F.everythingsearch.value = "";
			Addons.Everything.ShowButton();
		},

		ShowButton: function () {
			if (WINVER < 0x602 || window.chrome) {
				document.getElementById("ButtonEverythingClear").style.display = document.F.everythingsearch.value.length ? "inline" : "none";
			}
		},

		Exec: function () {
			WebBrowser.Focus();
			document.F.everythingsearch.focus();
		}
	};

	AddEvent("ChangeView", async function (Ctrl) {
		document.F.everythingsearch.value = await Sync.Everything.GetSearchString(Ctrl);
		Addons.Everything.ShowButton();
	});

	var width = "176px";
	var s = item.getAttribute("Width");
	if (s) {
		width = (GetNum(s) == s) ? s + "px" : s;
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.Everything.Exec, "Async");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.Everything.Exec, "Async");
	}
	AddTypeEx("Add-ons", "Everything", Addons.Everything.Exec);

	await $.importScript("addons\\" + Addon_Id + "\\sync.js");

	var z = screen.deviceYDPI / 96;
	SetAddon(Addon_Id, Default, ['<input type="text" name="everythingsearch" placeholder="Everything" onkeydown="return Addons.Everything.KeyDown(event)" onfocus="Addons.Everything.Focus(this)" onblur="Addons.Everything.ShowButton()" style="width:', EncodeSC(width), '; padding-right:', (WINVER < 0x602 || window.chrome ? 32 : 16) * z, 'px; vertical-align: middle"><span style="position: relative"><span id="ButtonEverythingClear" src="bitmap:ieframe.dll,545,13,1" onclick="Addons.Everything.Clear()" class="button" style="font-family: marlett; font-size:', 9 * z, 'px; display: none; position: absolute; left: ', -28 * z, 'px; top:', 4 * z, 'px">r</span><input type="image" src="', EncodeSC(await MakeImgDataEx(await Sync.Everything.Icon)), '" onclick="Addons.Everything.Search()" hidefocus="true" style="position: absolute; left:', -18 * z, 'px; top:', z, 'px; width:', 16 * z, 'px; height:', 16 * z, 'px"></span>'], "middle");
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}
