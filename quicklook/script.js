var Addon_Id = "quicklook";
var Default = "None";

var item = await GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "Edit");
	item.setAttribute("MenuPos", -1);

	item.setAttribute("KeyExec", 1);
	item.setAttribute("KeyOn", "List");
	item.setAttribute("Key", "$39");

	item.setAttribute("MouseOn", "List");
}

if (window.Addon == 1) {
	var h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	var s = item.getAttribute("Icon") || (h > 16 ? "bitmap:ieframe.dll,214,24,14" : "bitmap:ieframe.dll,216,16,14");
	s = ['<span class="button" id="WindowPreviewButton" onclick="Addons.QuickLook.Exec(this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({ title: item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name, src: s }, h), '</span>'];
	SetAddon(Addon_Id, Default, s);
	importJScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	EnableInner();
	SetTabContents(0, "General", '<input type="button" value="' + await api.sprintf(99, await GetText("Get %s..."), "QuickLook") + '" title="https://github.com/QL-Win/QuickLook/releases" onclick="wsh.Run(this.title)">');
}
