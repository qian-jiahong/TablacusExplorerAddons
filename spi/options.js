var Addon_Id = "spi";
var g_Chg = { List: false, Data: "List" };
var SPI;

function LoadFS() {
	if (!g_x.List) {
		g_x.List = document.F.List;
		g_x.List.length = 0;
		var nSelectSize = g_x.List.size;
		var xml = OpenXml(Addon_Id + (api.sizeof("HANDLE") * 8) + ".xml", false, false);
		if (xml) {
			var items = xml.getElementsByTagName("Item");
			var i = items.length;
			g_x.List.length = i;
			while (--i >= 0) {
				var item = items[i];
				SetData(g_x.List[i], [item.getAttribute("Name"), item.getAttribute("Path"), item.getAttribute("Disabled"), item.getAttribute("Filter"), item.getAttribute("Preview"), item.getAttribute("IsPreview"), item.getAttribute("UserFilter"), item.getAttribute("Sync")], !item.getAttribute("Disabled"));
			}
		}
		EnableSelectTag(g_x.List);
	}
}

function SaveFS() {
	if (g_Chg.List) {
		var xml = CreateXml();
		var root = xml.createElement("TablacusExplorer");
		var o = document.F.List;
		for (var i = 0; i < o.length; i++) {
			var item = xml.createElement("Item");
			var a = o[i].value.split(g_sep);
			item.setAttribute("Name", a[0]);
			item.setAttribute("Path", a[1]);
			item.setAttribute("Disabled", a[2]);
			item.setAttribute("Filter", a[3]);
			item.setAttribute("Preview", a[4]);
			item.setAttribute("IsPreview", a[5]);
			item.setAttribute("UserFilter", a[6]);
			item.setAttribute("Sync", a[7]);
			root.appendChild(item);
		}
		xml.appendChild(root);
		SaveXmlEx(Addon_Id + (api.sizeof("HANDLE") * 8) + ".xml", xml);
	}
}

function EditFS() {
	if (g_x.List.selectedIndex < 0) {
		return;
	}
	var a = g_x.List[g_x.List.selectedIndex].value.split(g_sep);
	document.F.Name.value = a[0];
	document.F.Path.value = a[1];
	document.F.Enable.checked = !a[2];
	document.F.Filter.checked = a[3];
	document.F.Preview.value = a[4] || "";
	document.F.IsPreview.checked = a[5];
	document.F.UserFilter.value = a[6] || "";
	document.F.Sync.checked = a[7];
	SetProp();
}

function ReplaceFS() {
	ClearX();
	if (g_x.List.selectedIndex < 0) {
		g_x.List.selectedIndex = ++g_x.List.length - 1;
		EnableSelectTag(g_x.List);
	}
	var sel = g_x.List[g_x.List.selectedIndex];
	o = document.F.Type;
	SetData(sel, [document.F.Name.value, document.F.Path.value, !document.F.Enable.checked, document.F.Filter.checked, document.F.Preview.value, document.F.IsPreview.checked, document.F.UserFilter.value, document.F.Sync.checked], document.F.Enable.checked);
	g_Chg.List = true;
}

function PathChanged() {
	if (/ZBYPASS/i.test(document.F.Path.value)) {
		document.F.Sync.checked = true;
	}
	SetProp(true);
}

function SetProp(bName) {
	SPI = null;
	var dllPath = api.PathUnquoteSpaces(ExtractMacro(te, document.F.Path.value));
	if (Addons.SPI.DLL) {
		SPI = Addons.SPI.DLL.open(dllPath) || {};
	}
	if (bName && SPI.GetPluginInfo) {
		var ar = [];
		SPI.GetPluginInfo(ar);
		document.F.Name.value = ar[1];
	}
	var arProp = ["IsUnicode", "GetPluginInfo", "IsSupported", "GetPictureInfo", "GetPicture", "GetPreview", "GetArchiveInfo", "GetFileInfo", "GetFile", "ConfigurationDlg"];
	var arHtml = [[], [], [], []];
	var s = [];
	var ar = [];
	if (SPI) {
		for (var i in arProp) {
			arHtml[i % 3].push('<div style="white-space: nowrap"><input type="checkbox" ', SPI[arProp[i]] ? "checked" : "", ' onclick="return false;">', arProp[i].replace(/^Is/, ""), '</div>');
		}
		for (var i = 4; i--;) {
			document.getElementById("prop" + i).innerHTML = arHtml[i].join("");
		}
		if (SPI.GetPluginInfo) {
			SPI.GetPluginInfo(ar);
		} else {
			ar.unshift(fso.GetFileName(dllPath));
		}
		if (SPI.ConfigurationDlg) {
			s.push('<input type="button" value="', GetText("Options..."), '" onclick="SPI.ConfigurationDlg(', te.hwnd, ', 1)"><br>');
		}
	}
	s.push('<table border="1px" style="width: 100%">');
	for (var i = 0; i < ar.length; i += 2) {
		s.push('<tr><td>', ar[i], '</td><td>', ar[i + 1], '</td></tr>');
	}
	s.push('</table>')
	document.getElementById("ext").innerHTML = s.join("");
	var filter = [];
	for (var j = 2; j < ar.length; j += 2) {
		filter.push(ar[j]);
	}
	document.F.elements["UserFilter"].setAttribute("placeholder", filter.join(";") || "*");
}

function ED(s) {
	var ar = s.split("").reverse();
	for (var i in ar) {
		ar[i] = String.fromCharCode(ar[i].charCodeAt(0) ^ 13);
	}
	return ar.join("");
}

ApplyLang(document);
var info = GetAddonInfo(Addon_Id);
var bit = api.sizeof("HANDLE") * 8;
var bitName = GetTextR(bit + "-bit");
document.title = info.Name + " " + bitName;
if (bit == 64) {
	document.getElementById("bit1").innerHTML = "(sph/" + bitName + ")";
	document.getElementById("_browse1").onclick = function () {
		RefX('Path', 0, 0, 1, info.Name + ' ' + bitName + ' (*.sph)|*.sph');
	}
} else {
	document.getElementById("bit1").innerHTML = "(spi/" + bitName + ")";
	document.getElementById("_browse1").onclick = function () {
		RefX('Path', 0, 0, 1, info.Name + ' ' + bitName + ' (*.spi)|*.spi');
	}
}

LoadFS();
SetOnChangeHandler();

AddEventEx(window, "beforeunload", function () {
	if (g_nResult == 2 || !g_bChanged) {
		return;
	}
	if (ConfirmX(true, ReplaceFS)) {
		SaveFS();
		TEOk();
	}
});
