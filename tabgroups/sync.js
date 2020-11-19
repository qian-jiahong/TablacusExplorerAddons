Common.Tabgroups.rcItem = api.CreateObject("Array");

Sync.Tabgroups = {
	Add: function () {
		var s;
		var Name = {};
		var nLen = te.Data.Tabgroups.Data.length;
		for (var i = nLen; i--;) {
			Name[te.Data.Tabgroups.Data[i].Name] = true;
		}
		for (var i = 0; i <= nLen; i++) {
			s = GetText("Group") + (i + 1);
			if (!Name[s]) {
				Sync.Tabgroups.New(s);
				break;
			}
		}
		InvokeUI("Addons.Tabgroups.Arrange", [true]);
	},

	New: function (a1, a2, a3) {
		var o = api.CreateObject("Object");
		o.Name = a1 || "";
		o.Color = a2 || "";
		o.Lock = GetNum(a3) & 1;
		te.Data.Tabgroups.Data.push(o);
	},

	FromPt: function (pt) {
		var ptc = pt.Clone();
		api.ScreenToClient(WebBrowser.hwnd, ptc);
		for (var i = Math.min(te.Data.Tabgroups.Data.length, Common.Tabgroups.rcItem.length); i-- > 0;) {
			if (PtInRect(Common.Tabgroups.rcItem[i], ptc)) {
				return i;
			}
		}
		return -1;
	},

    LoadWindow: function (xml) {
        var items = xml ? xml.getElementsByTagName("Group") : {};
        if (items.length) {
			te.Data.Tabgroups.Click = items.length ? GetNum(items[0].getAttribute("Index")) : 1;
            items = items[0].getElementsByTagName("Item");
        } else {
            xml = OpenXml("tabgroups.xml", true, true);
            items = xml.getElementsByTagName("Index");
            te.Data.Tabgroups.Click = items.length ? GetNum(items[0].text) : 1;
            items = xml.getElementsByTagName("Item");
            Common.Tabgroups.DeleteOldXml = items.length;
		}
        if (items.length) {
            te.Data.Tabgroups.Data = api.CreateObject("Array");
            for (var i = 0; i < items.length; i++) {
				Sync.Tabgroups.New(items[i].getAttribute("Name"), items[i].getAttribute("Color"), items[i].getAttribute("Lock"));
            }
		}
		if (te.Data.Tabgroups.Data.length) {
			InvokeUI("Addons.Tabgroups.Arrange", [true]);
		} else {
			Sync.Tabgroups.Add();
		}
    },

    Load: function () {
        var commdlg = api.CreateObject("CommonDialog");
        commdlg.InitDir = fso.BuildPath(te.Data.DataFolder, "layout");
        commdlg.Filter = MakeCommDlgFilter("*.xml");
        commdlg.Flags = OFN_FILEMUSTEXIST;
        if (commdlg.ShowOpen()) {
            var fn = api.PathUnquoteSpaces(commdlg.filename);
            if (fso.FileExists(fn)) {
                xml = te.CreateObject("Msxml2.DOMDocument");
                xml.async = false;
                xml.load(fn);
            }
            var items = xml.getElementsByTagName("Group");
            if (items.length) {
                var items = items[0].getElementsByTagName("Item");
                if (items.length == 1) {
                    this.New(items[0].getAttribute("Name"), items[0].getAttribute("Color"), items[0].getAttribute("Lock"));
                    var nGroup = te.Data.Tabgroups.Data.length;
                    te.Data.Tabgroups.Click = nGroup;
                    LoadXml(xml, nGroup);
                }
            }
            this.Arrange();
        }
    },

    Save: function () {
        var commdlg = api.CreateObject("CommonDialog");
        commdlg.InitDir = fso.BuildPath(te.Data.DataFolder, "layout");
        commdlg.Filter = MakeCommDlgFilter("*.xml");
        commdlg.DefExt = "xml";
        commdlg.Flags = OFN_OVERWRITEPROMPT;
        if (commdlg.ShowSave()) {
            var fn = api.PathUnquoteSpaces(commdlg.filename);
            var xml = CreateXml(true);
            var nGroup = te.Data.Tabgroups.Click;
            var cTC = te.Ctrls(CTRL_TC);
            for (var i in cTC) {
                if (cTC[i].Data.Group == nGroup) {
                    SaveXmlTC(cTC[i], xml, 1);
                }
            }
            var item = xml.createElement("Group");
            item.setAttribute("Index", 1);
            xml.documentElement.appendChild(item);
            this.Save3(xml, item, nGroup - 1);
            try {
                xml.save(fn);
            } catch (e) {
                if (e.number != E_ACCESSDENIED) {
                    ShowError(e, [GetText("Save"), fn].join(": "));
                }
            }
        }
    },

    Save2: function (xml) {
        var item = xml.createElement("Group");
        item.setAttribute("Index", te.Data.Tabgroups.Index);
        xml.documentElement.appendChild(item);
        for (var i = 0; i < te.Data.Tabgroups.Data.length; i++) {
            Sync.Tabgroups.Save3(xml, item, i)
        }
    },

    Save3: function (xml, parent, i) {
        var item = xml.createElement("Item");
        var o = te.Data.Tabgroups.Data[i];
        item.setAttribute("Name", o.Name);
        item.setAttribute("Color", o.Color);
        item.setAttribute("Lock", o.Lock);
        parent.appendChild(item);
    },
}

AddEvent("DragEnter", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
	if (Ctrl.Type == CTRL_WB) {
		return S_OK;
	}
});

AddEvent("DragOver", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
	if (Ctrl.Type == CTRL_WB) {
		var res = /^tabgroups(\d+)/.exec(Common.Tabgroups.Drag5);
		if (res) {
			var nDrop = Sync.Tabgroups.FromPt(pt) + 1;
			if (nDrop > 0) {
				pdwEffect[0] = DROPEFFECT_MOVE;
				return S_OK;
			}
		}
		if (Common.Tabgroups.DragOpen) {
			var i = Sync.Tabgroups.FromPt(pt);
			if (i >= 0) {
				if (i != te.Data.Tabgroups.Index) {
					if (IsDrag(pt, Common.Tabgroups.pt)) {
						Common.Tabgroups.pt = pt.Clone();
						InvokeUI("Addons.Tabgroups.Over", i + 1);
					}
				}
				return S_OK;
			}
		}
	}
});

AddEvent("Drop", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
	if (Ctrl.Type == CTRL_WB) {
		var res = /^tabgroups(\d+)/.exec(Common.Tabgroups.Drag5);
		if (res) {
			var nDrop = Sync.Tabgroups.FromPt(pt) + 1;
			if (nDrop > 0) {
				InvokeUI("Addons.Tabgroups.Drop", [res[1], nDrop]);
				return S_OK;
			}
		}
	}
});

AddEvent("DragLeave", function () {
	InvokeUI("Addons.Tabgroups.ClearTid");
});

AddEvent("LoadWindow", Sync.Tabgroups.LoadWindow);

AddEvent("SaveWindow", function (xml, all) {
	Sync.Tabgroups.Save2(xml);
	if (all && Common.Tabgroups.DeleteOldXml) {
		DeleteItem(fso.BuildPath(te.Data.DataFolder, "config\\tabgroups.xml"));
	}
});
