'use babel'

import { CompositeDisposable } from 'atom'
import { getSiblings } from './utils'

export default {

  subscriptions: null,
  ActivePane: null,
  FollowObserver: null,
  modifiedPanes: [],

  activate(state) {
    this.subscriptions = new CompositeDisposable()

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'hey-pane:toggle-focus-of-active-pane': () => this.toggleFocus(),
      'hey-pane:toggle-follow-mode': () => this.followMe()
    }))
  },

  deactivate() {
    this.subscriptions.dispose()

    if (this.FollowObserver != null)
      this.FollowObserver.dispose()
  },

  followMe() {
    if (this.FollowObserver != null) {
      this.FollowObserver.dispose()
      this.FollowObserver = null
    } else {
      this.FollowObserver = atom.workspace.onDidStopChangingActivePaneItem((pane) => {
        this.setAutoFocus()
      })
    }
  },

  setAutoFocus() {
    if (this.ActivePane != null) {
      this.undoFocus()
    }
    this.doFocus()
  },

  toggleFocus() {
    if (this.ActivePane != null) {
      this.undoFocus()
    } else {
      this.doFocus()
    }
  },

  doFocus() {
    this.ActivePane = this.getActivePane()
    this.ActivePane.classList.add('hey-pane-focus')

    var recursiveSet = (node) => {
      if (node.parentNode.nodeName === 'ATOM-PANE-AXIS') {
        this.saveElementStateAndSetFlex(node, 0.94)
        getSiblings(node)
        .filter(pane => pane.nodeName !== 'ATOM-PANE-RESIZE-HANDLE')
        .forEach(pane => {
          this.saveElementStateAndSetFlex(pane, 0.06)
        })

        if (node.parentNode.parentNode.nodeName !== 'ATOM-PANE-CONTAINER') {
          recursiveSet(node.parentNode)
        }
      }
    }

    recursiveSet(this.ActivePane);
  },

  undoFocus() {
    this.ActivePane.classList.remove('hey-pane-focus')
    this.ActivePane = null
    this.restorePanes()
    this.emptyPaneStates()
  },

  saveElementStateAndSetFlex(el, newFlexValue) {
    const oldFlexValue = el.style.flexGrow
    this.modifiedPanes.push({ el, oldFlexValue })
    el.style.flexGrow = newFlexValue
  },

  restorePanes() {
    const Container = this.getPanesContainer()
    this.modifiedPanes.forEach(pane => {
      if (Container.contains(pane.el)) {
        pane.el.style.flexGrow = pane.oldFlexValue
      }
    })
  },

  emptyPaneStates() {
    this.modifiedPanes = []
  },

  getPanesContainer() {
    const View = atom.views.getView(atom.workspace);
    return View.querySelector('.panes');
  },

  getActivePane() {
    const View = atom.views.getView(atom.workspace);
    return View.querySelector('.pane.active');
  }

};
