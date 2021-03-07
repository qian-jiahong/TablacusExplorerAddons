const Addon_Id = "colorlabels";
const item = GetAddonElement(Addon_Id);

Sync.ColorLabels = {
	CONFIG: BuildPath(te.Data.DataFolder, "config\\colorlabels.tsv"),
	bSave: false,
	Portable: GetNum(item.getAttribute("Portable")),
	Tabs: GetNum(item.getAttribute("Tabs")),
	SyncItem: {},
	strName: item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name,
	nPos: GetNum(item.getAttribute("MenuPos")),

	Get: function (path) {
		if (!/string/i.test(typeof path)) {
			path = api.GetDisplayNameOf(path, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING) || "";
		}
		const cl = Sync.ColorLabels.DB && Sync.ColorLabels.DB.Get(path.toLowerCase());
		return cl ? GetWinColor(cl) : null;
	},

	GetWebColor: function (path) {
		if (!/string/i.test(typeof path)) {
			path = api.GetDisplayNameOf(path, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING) || "";
		}
		return Sync.ColorLabels.DB && Sync.ColorLabels.DB.Get(path.toLowerCase());
	},

	Exec: function (Ctrl, pt) {
		const Selected = GetSelectedArray(Ctrl, pt, true).shift();
		if (Selected && Selected.Count) {
			const cl = ChooseColor(Sync.ColorLabels.Get(Selected.Item(0)));
			for (let i = Selected.Count; i--;) {
				Sync.ColorLabels.Set(Selected.Item(i), cl);
			}
			if (Sync.ColorLabels.Tabs) {
				const cTC = te.Ctrls(CTRL_TC, true);
				for (let i in cTC) {
					RunEvent3("SelectionChanged", cTC[i]);
				}
			}
		}
		return S_OK;
	},

	Set: function (path, cl) {
		if (path && Sync.ColorLabels.DB) {
			if (!/string/i.test(typeof path)) {
				path = api.GetDisplayNameOf(path, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING) || "";
			}
			Sync.ColorLabels.DB.Set(path.toLowerCase(), GetWebColor(cl));
		}
	},

	SetSync: function (name, s) {
		Sync.ColorLabels.SyncItem[name] = s;
		InvokeUI("Addons.ColorLabels.StartSync");
	},

	ClearSync: function () {
		Sync.ColorLabels.SyncItem = {};
	}

}

AddEvent("Load", function () {
	Sync.ColorLabels.DB = new SimpleDB("colorlabels").Load();
	AddEvent("SaveConfig", function () {
		Sync.ColorLabels.DB.Save();
	});
	const Installed0 = (Sync.ColorLabels.DB.Get('%Installed%') || "").toUpperCase();
	const Installed1 = Sync.ColorLabels.Portable ? fso.GetDriveName(api.GetModuleFileName(null)).toUpperCase() : "";
	if (Installed0 && Sync.ColorLabels.Portable && Installed0 != Installed1) {
		Sync.ColorLabels.DB.ENumCB(function (path, value) {
			const drv = fso.GetDriveName(path);
			if (drv.toUpperCase() == Installed0) {
				Sync.ColorLabels.Set(path);
				Sync.ColorLabels.Set(Installed1 + path.substr(drv.length), value);
			}
		});
	}
	if (Sync.ColorLabels.Portable || Installed0) {
		Sync.ColorLabels.DB.Set('%Installed%', Installed1);
	}
});

AddEvent("ItemPrePaint2", function (Ctrl, pid, nmcd, vcd, plRes) {
	if (pid) {
		let cl = Sync.ColorLabels.Get(pid);
		if (cl != null) {
			vcd.clrTextBk = cl;
			const brush = api.CreateSolidBrush(cl);
			api.FillRect(nmcd.hdc, nmcd.rc, brush);
			api.DeleteObject(brush);
			if (vcd.clrText == GetSysColor(COLOR_WINDOWTEXT)) {
				cl = (cl & 0xff) * 299 + (cl & 0xff00) * 2.29296875 + (cl & 0xff0000) * 0.001739501953125;
				vcd.clrText = cl > 127000 ? 0 : 0xffffff;
			}
		}
	}
});

AddEvent("ChangeNotify", function (Ctrl, pidls) {
	if (Sync.ColorLabels.DB) {
		if (pidls.lEvent & (SHCNE_RENAMEFOLDER | SHCNE_RENAMEITEM)) {
			let name = fso.GetFileName(api.GetDisplayNameOf(pidls[0], SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL));
			let s = Sync.ColorLabels.Get(pidls[0]);
			if (s) {
				Sync.ColorLabels.SetSync(name, s);
			} else {
				name = fso.GetFileName(api.GetDisplayNameOf(pidls[1], SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL));
				s = Sync.ColorLabels.SyncItem[name];
			}
			if (s) {
				Sync.ColorLabels.Set(pidls[1], s);
			}
			Sync.ColorLabels.Set(pidls[0]);
		}
		if (pidls.lEvent & SHCNE_DELETE) {
			let name = fso.GetFileName(api.GetDisplayNameOf(pidls[0], SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL));
			Sync.ColorLabels.SetSync(name, Sync.ColorLabels.Get(pidls[0]));
			Sync.ColorLabels.Set(pidls[0]);
		}
		if (pidls.lEvent & SHCNE_CREATE) {
			let name = fso.GetFileName(api.GetDisplayNameOf(pidls[0], SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL));
			const Item = Sync.ColorLabels.SyncItem[name];
			if (Item) {
				Sync.ColorLabels.Set(pidls[0], Item);
			}
		}
	}
});

if (Sync.ColorLabels.Tabs) {
	AddEvent("GetTabColor", Sync.ColorLabels.GetWebColor);
}

//Menu
if (item.getAttribute("MenuExec")) {
	AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos) {
		api.InsertMenu(hMenu, Sync.ColorLabels.nPos, MF_BYPOSITION | MF_STRING, ++nPos, GetText(Sync.ColorLabels.strName));
		ExtraMenuCommand[nPos] = Sync.ColorLabels.Exec;
		return nPos;
	});
}
//Key
if (item.getAttribute("KeyExec")) {
	SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Sync.ColorLabels.Exec, "Func");
}
//Mouse
if (item.getAttribute("MouseExec")) {
	SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Sync.ColorLabels.Exec, "Func");
}

AddTypeEx("Add-ons", "Color labels", Sync.ColorLabels.Exec);