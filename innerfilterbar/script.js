const Addon_Id = "innerfilterbar";
const item = await GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.InnerFilterBar = {
		tid: [],
		filter: [],
		iCaret: [],
		Width: '176px',
		RE: item.getAttribute("RE"),

		KeyDown: function (ev, o, Id) {
			var k = ev.keyCode;
			if (k != VK_PROCESSKEY) {
				this.filter[Id] = o.value;
				clearTimeout(this.tid[Id]);
				if (k == VK_RETURN) {
					this.Change(Id);
					return false;
				} else {
					this.tid[Id] = setTimeout("Addons.InnerFilterBar.Change(" + Id + ")", 500);
				}
			}
		},

		KeyUp: function (ev, Id) {
			var k = ev.keyCode;
			if (k == VK_UP || k == VK_DOWN) {
				(async function () {
					var TC = await te.Ctrl(CTRL_TC, Id);
					if (TC) {
						var FV = await TC.Selected;
						if (FV) {
							FV.Focus();
						}
					}
				})();
				return false;
			}
		},

		Change: async function (Id) {
			var o = document.F["filter_" + Id];
			Addons.InnerFilterBar.ShowButton(o, Id);
			var FV = await GetInnerFV(Id);
			var s = o.value;
			if (s) {
				if (Addons.InnerFilterBar.RE && !/^\*|\//.test(s)) {
					s = "/" + s + "/i";
				} else {
					if (!/^\//.test(s)) {
						var ar = s.split(/;/);
						for (var i in ar) {
							var res = /^([^\*\?]+)$/.exec(ar[i]);
							if (res) {
								ar[i] = "*" + res[1] + "*";
							}
						}
						s = ar.join(";");
					}
				}
			}
			if (!SameText(s, await FV.FilterView)) {
				FV.FilterView = s || null;
				FV.Refresh();
			}
		},

		Focus: function (o, Id) {
			Activate(o, Id);
			o.select();
			if (this.iCaret[Id] >= 0) {
				var range = o.createTextRange();
				range.move("character", this.iCaret[Id]);
				range.select();
				this.iCaret[Id] = -1;
			}
		},

		Clear: async function (flag, Id) {
			var o = document.F.elements["filter_" + Id];
			o.value = "";
			this.ShowButton(o, Id);
			if (flag) {
				var FV = await GetInnerFV(Id);
				FV.FilterView = null;
				FV.Refresh();
				FV.Focus();
			}
		},

		ShowButton: function (oFilter, Id) {
			if (WINVER < 0x602 || window.chrome) {
				document.getElementById("ButtonFilterClear_" + Id).style.display = oFilter.value.length ? "inline" : "none";
			}
		},

		Exec: async function (Ctrl, pt) {
			var FV = await GetFolderView(Ctrl, pt);
			var o = document.F.elements["filter_" + await FV.Parent.Id];
			if (o) {
				WebBrowser.Focus();
				o.focus();
			}
			return S_OK;
		},

		GetFilter: async function (Ctrl) {
			if (await Ctrl.Type <= CTRL_EB) {
				var Id = await Ctrl.Parent.Id;
				var o = document.F.elements["filter_" + Id];
				if (o) {
					clearTimeout(Addons.InnerFilterBar.tid[Id]);
					var s = Addons.InnerFilterBar.GetString(await Ctrl.FilterView);
					if (s != Addons.InnerFilterBar.GetString(o.value)) {
						o.value = s;
						Addons.InnerFilterBar.ShowButton(o, Id);
					}
				}
			}
		},

		GetString: function (s) {
			if (Addons.InnerFilterBar.RE) {
				var res = /^\/(.*)\/i/.exec(s);
				if (res) {
					s = res[1];
				}
			} else if (s && !/^\//.test(s)) {
				var ar = s.split(/;/);
				for (var i in ar) {
					var res = /^\*([^/?/*]+)\*$/.exec(ar[i]);
					if (res) {
						ar[i] = res[1];
					}
				}
				s = ar.join(";");
			}
			return s;
		},

		FilterList: function (o, id) {
			if (Addons.FilterList) {
				Addons.FilterList.Exec(o, null, id);
			}
			return false;
		}
	};

	AddEvent("PanelCreated", function (Ctrl, Id) {
		var z = screen.deviceYDPI / 96;
		var nSize = Addons.InnerFilterBar.IconS;
		var s = ['<input type="text" name="filter_', Id, '" placeholder="Filter" onkeydown="return Addons.InnerFilterBar.KeyDown(event, this,', Id, ')"  onkeyup="return Addons.InnerFilterBar.KeyUp(event,', Id, ')" onmouseup="Addons.InnerFilterBar.KeyDown(event, this,', Id, ')" onfocus="Addons.InnerFilterBar.Focus(this,', Id, ')" onblur="Addons.InnerFilterBar.ShowButton(this,', Id, ')" ondblclick="return Addons.InnerFilterBar.FilterList(this,', Id, ')" style="width: ', EncodeSC(Addons.InnerFilterBar.Width), '; padding-right: ', nSize * z, 'px; vertical-align: middle"><span style="position: relative"><input type="image" src="', EncodeSC(Addons.InnerFilterBar.Icon), '" id="ButtonFilter_', Id, '" hidefocus="true" style="position: absolute; left:', -18 * z, 'px; top:', (18 - nSize) / 2 * z, 'px; width: ', nSize * z, 'px; height: ', nSize * z, 'px" onclick="return Addons.InnerFilterBar.FilterList(this,', Id, ')" oncontextmenu="return Addons.InnerFilterBar.FilterList(this,', Id, ')"><span id="ButtonFilterClear_', Id, '" style="font-family: marlett; font-size:', 9 * z, 'px; display: none; position: absolute; left:', -28 * z, 'px; top: ', 4 * z, 'px" class="button" onclick="Addons.InnerFilterBar.Clear(true,', Id, ')">r</span></span>'];
		SetAddon(null, "Inner1Right_" + Id, s.join(""));
	});

	AddEvent("ChangeView", Addons.InnerFilterBar.GetFilter);
	AddEvent("Command", Addons.InnerFilterBar.GetFilter);

	var s = item.getAttribute("Width");
	if (s) {
		Addons.InnerFilterBar.Width = (GetNum(s) == s) ? (s + "px") : s;
	}
	Addons.InnerFilterBar.Icon = item.getAttribute("Icon") ? await ExtractMacro(te, await api.PathUnquoteSpaces(item.getAttribute("Icon"))) : await MakeImgSrc("bitmap:comctl32.dll,140,13,0", 0, false, 13);
	Addons.InnerFilterBar.IconS = item.getAttribute("Icon") ? 16 : 13;
	//Menu
	if (item.getAttribute("MenuExec")) {
		Common.InnerFilterBar = await api.CreateObject("Object");
		Common.InnerFilterBar.strMenu = item.getAttribute("Menu");
		Common.InnerFilterBar.strName = item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name;
		Common.InnerFilterBar.nPos = GetNum(item.getAttribute("MenuPos"));
		$.importScript("addons\\" + Addon_Id + "\\sync.js");
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.InnerFilterBar.Exec, "Func");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.InnerFilterBar.Exec, "Func");
	}
	AddTypeEx("Add-ons", "Inner Filter Bar", Addons.InnerFilterBar.Exec);
} else {
	SetTabContents(0, "General", '<table style="width: 100%"><tr><td><label>Width</label></td></tr><tr><td><input type="text" name="Width" size="10"></td><td><input type="button" value="Default" onclick="document.F.Width.value=\'\'"></td></tr><tr><td><label>Filter</label></td></tr><tr><td><input type="checkbox" id="RE" name="RE"><label for="RE">Regular Expression</label>/<label for="RE">Migemo</label></td></tr></table>');
	ChangeForm([["__IconSize", "style/display", "none"]]);
}
