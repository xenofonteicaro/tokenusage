class Tokenusage < Formula
  desc "Local dashboard for AI tool token usage"
  homepage "https://github.com/xenofonteicaro/tokenusage"
  url "https://github.com/xenofonteicaro/tokenusage/releases/download/v0.3.0/tokenusage-0.3.0.tar.gz"
  version "0.3.0"
  sha256 "e60dbfd4298a04f6b512de90784f173d2b3c32f5624300fb8abb35850512d793"

  depends_on "node"

  def install
    system "npm", "ci"
    system "npm", "run", "build"
    system "npm", "run", "build:tui"

    libexec.install ".next/standalone" => "app"
    libexec.install "dist/tui.mjs"
    (libexec/"app/.next").install buildpath/".next/static" => "static"
    (libexec/"app/public").install buildpath/"public" if (buildpath/"public").directory?

    node = formula_opt_bin("node")/"node"
    (bin/"tokenusage").write <<~BASH
      #!/bin/bash
      set -euo pipefail

      export HOME="${HOME:-#{Dir.home}}"
      export TOKENUSAGE_DATA_DIR="${TOKENUSAGE_DATA_DIR:-$HOME/Library/Application Support/tokenusage}"
      export HOSTNAME="${HOSTNAME:-127.0.0.1}"
      export PORT="${PORT:-3000}"

      case "${1:-help}" in
        serve)
          exec "#{node}" "#{opt_libexec}/app/server.js"
          ;;
        start)
          brew services start tokenusage
          for _ in {1..30}; do
            if curl --fail --silent --max-time 2 http://127.0.0.1:3000/api/usage >/dev/null; then
              open http://127.0.0.1:3000
              exit 0
            fi
            sleep 1
          done
          echo "The service started, but the dashboard did not respond on port 3000." >&2
          exit 1
          ;;
        stop)
          exec brew services stop tokenusage
          ;;
        restart)
          exec brew services restart tokenusage
          ;;
        open)
          exec open http://127.0.0.1:3000
          ;;
        logs)
          exec tail -f "$(brew --prefix)/var/log/tokenusage.log"
          ;;
        tui)
          shift
          exec "#{node}" "#{opt_libexec}/tui.mjs" "$@"
          ;;
        help|--help|-h)
          cat <<'HELP'
      tokenusage start    Start the local service and open the dashboard
      tokenusage stop     Stop the service
      tokenusage restart  Restart the service
      tokenusage open     Open the dashboard in your browser
      tokenusage logs     Follow the local service log
      tokenusage tui      Show the dashboard in the terminal (tokenusage tui --help)
      HELP
          ;;
        *)
          echo "Unknown command: $1" >&2
          echo "Use: tokenusage --help" >&2
          exit 2
          ;;
      esac
    BASH
  end

  service do
    run [opt_bin/"tokenusage", "serve"]
    keep_alive true
    log_path var/"log/tokenusage.log"
    error_log_path var/"log/tokenusage.log"
    environment_variables HOME: Dir.home, HOSTNAME: "127.0.0.1", PORT: "3000"
  end

  def caveats
    <<~EOS
      Start the dashboard and open your browser with:
        tokenusage start

      To stop the service:
        tokenusage stop

      To see the numbers in the terminal, without the web service:
        tokenusage tui

      Change the language under Preferences → General → Interface language.
    EOS
  end

  test do
    assert_match "tokenusage start", shell_output("#{bin}/tokenusage --help")
    assert_match "tokenusage tui", shell_output("#{bin}/tokenusage --help")
    assert_match "Usage: tokenusage tui", shell_output("#{bin}/tokenusage tui --help --lang en")
  end
end
