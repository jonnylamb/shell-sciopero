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
const Gdk = imports.gi.Gdk;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Soup = imports.gi.Soup;
const St = imports.gi.St;

const DATA_URL = "http://sciopero.jonnylamb.com/future.json";
const DAYS_WARNING = 1;
const ICON_UPCOMING = "dialog-warning-symbolic";
const ICON_ONGOING = "dialog-warning";

let sciopero = null;

let debugEnabled = false;

function debug(message) {
    if (debugEnabled)
        log ("Sciopero: " + message);
}

const Sciopero = new Lang.Class({
    Name: "Sciopero",
    Extends: PanelMenu.Button,

    _init: function() {
        this.parent(0.0, "Roma Sciopero");

        this.session = new Soup.Session();

        this.icon = new St.Icon();
        this.icon.set_icon_size(16);

        this.actor.visible = false;
        this.actor.add_actor(this.icon);

        this.update();
    },

    update: function() {
        let uri = new Soup.URI(DATA_URL);
        let message = new Soup.Message({method: "GET", uri: uri});

        this.session.queue_message(message, Lang.bind(this, this.response));
    },

    response: function(session, message) {
        if (!message.response_body.data) {
            debug("no data in the response");
            return;
        }

        let j = JSON.parse(message.response_body.data);
        this.parse(j);
    },

    addElement: function(title, func) {

        let menuItem = new PopupMenu.PopupMenuItem(title);
        menuItem.connect('activate', Lang.bind(this, function() {
            this.menu.close(BoxPointer.PopupAnimation.NONE);
            func();
        }));
        this.menu.addMenuItem(menuItem);

        debug("added element '" + title + "'");
    },

    parse: function(data) {
        let ongoing = false;
        let upcoming = false;

        debug("starting parsing");

        let now = new Date();

        for (let i = 0; i < data.length; i++) {
            let item = data[i];

            let from = new Date(item.from);
            let ends = new Date(item.ends);

            if (now <= ends && now >= from) {
                ongoing = true;
                debug("found one ongoing");
            } else if (now > ends) {
                debug("found one in the future");
                continue;
            } else {
                // this is pretty ugly
                from.setHours(0);
                from.setMinutes(0);
                from.setSeconds(0);
                from.setMilliseconds(0);

                now.setHours(0);
                now.setMinutes(0);
                now.setSeconds(0);
                now.setMilliseconds(0);

                let difference = Math.round((from - now) / 1000 / 60 / 60 / 24);

                debug("found one in " + difference + " day(s)");

                if (difference <= DAYS_WARNING) {
                    upcoming = true;
                }
            }

            if (upcoming || ongoing) {
                this.addElement(item.title, function() {
                    Gtk.show_uri(null, item.link, Gdk.CURRENT_TIME);
                });
            }
        }

        if (ongoing) {
            this.icon.set_icon_name(ICON_ONGOING);
        } else if (upcoming) {
            this.icon.set_icon_name(ICON_UPCOMING);
        }

        this.actor.visible = ongoing || upcoming;

        debug("finished parsing");
    }
});

function init() {
    if (GLib.getenv("SCIOPERO_DEBUG")) {
        debugEnabled = true;
        debug("initialising");
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
