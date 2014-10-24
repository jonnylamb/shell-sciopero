/*
 * Copyright (C) 2014 Jonny Lamb <jonnylamb@jonnylamb.com>
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
 */

const BoxPointer = imports.ui.boxpointer;
const GLib = imports.gi.GLib;
const Lang = imports.lang;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const St = imports.gi.St;

let sciopero = null;

let debugEnabled = false;
let alwaysShow = false;

function debug(message) {
    if (debugEnabled)
        log ("Sciopero: " + message);
}

const Sciopero = new Lang.Class({
    Name: "Sciopero",
    Extends: PanelMenu.Button,

    _init: function() {
        this.parent(0.0, "Roma Sciopero");

        this.icon = new St.Icon();
        this.icon.set_icon_size(16);

        this.actor.visible = false;
        this.actor.add_actor(this.icon);

        this.update();
    },

    update: function() {
        /* TODO */
        this.icon.set_icon_name("dialog-warning-symbolic");
        this.actor.visible = alwaysShow || true;

        this.addElement("Sciopero Atac e trasporto pubblico: stop 24 ore 1° ottobre 2014", function() {});
    },

    addElement: function(title, func) {

        let menuItem = new PopupMenu.PopupMenuItem(title);
        menuItem.connect('activate', Lang.bind(this, function() {
            this.menu.close(BoxPointer.PopupAnimation.NONE);
            func();
        }));
        this.menu.addMenuItem(menuItem);

        debug("added element '" + title + "'");
    }
});

function init() {
    if (GLib.getenv("SCIOPERO_DEBUG")) {
        debugEnabled = true;
        debug("initialising");
    }

    if (GLib.getenv("SCIOPERO_ALWAYS_SHOW")) {
        alwaysShow = true;
        debug("always showing icon");
    }
}

function enable() {
    debug("enabling");

    sciopero = new Sciopero();
    Main.panel.addToStatusArea('sciopero', sciopero, 0);
}

function disable() {
    debug("disabling");

    sciopero.destroy();
    sciopero = null;
}
