import React from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter as Router, matchPath } from 'react-router-dom'
import { Provider } from 'react-redux'
import Html from './components/HTML'
import { ServerStyleSheet } from 'styled-components'
import { renderRoutes } from 'react-router-config'
import FirebaseService from '../shared/firebase/services/FirebaseService'

import routes from '../shared/routes/routes'

const serverRenderer = () => (req, res) => {
  FirebaseService.store = req.store

  const activeRoute = routes[0].routes.find((route) => matchPath(req.url, route))

  const dataRequirements = activeRoute.component.serverFetch
    ? activeRoute.component.serverFetch()
    : Promise.resolve()

  dataRequirements.then(() => {
    const sheet = new ServerStyleSheet()

    const content = renderToString(
      sheet.collectStyles(
        <Provider store={req.store}>
          <Router location={req.url} context={{}}>
            { renderRoutes(routes) }
          </Router>
        </Provider>
      )
    )

    const styles = sheet.getStyleElement()
    const state = JSON.stringify(req.store.getState())

    const HtmlComponent = <Html
      styles={styles}
      scripts={[res.locals.assetPath('bundle.js'), res.locals.assetPath('vendor.js')]}
      state={state}
    >
      {content}
    </Html>

    return res.send(
      `<!doctype html>
      ${renderToString(HtmlComponent)}`
    )
  })
}

export default serverRenderer