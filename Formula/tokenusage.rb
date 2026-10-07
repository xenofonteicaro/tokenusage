class Tokenusage < Formula
  desc "Dashboard local de uso de tokens de ferramentas de IA"
  homepage "https://github.com/xenofonteicaro/tokenusage"
  url "git@github.com:xenofonteicaro/tokenusage.git",
      tag:      "v0.1.0",
      revision: "899e9e74ed2ae5d7120d0a46be67c29297d78a48"
  version "0.1.0"

  depends_on "node"

  def fetch
    system "npm", "ci"
    system "npm", "run", "build"
  end

  def install
    libexec.install ".next/standalone" => "app"
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
          echo "O serviço iniciou, mas a dashboard não respondeu na porta 3000." >&2
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
        help|--help|-h)
          cat <<'HELP'
      tokenusage start    Inicia o serviço local e abre a dashboard
      tokenusage stop     Encerra o serviço
      tokenusage restart  Reinicia o serviço
      tokenusage open     Abre a dashboard no navegador
      tokenusage logs     Acompanha o log local
      HELP
          ;;
        *)
          echo "Comando desconhecido: $1" >&2
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
      Inicie a dashboard e abra o navegador com:
        tokenusage start

      Para encerrar o serviço:
        tokenusage stop

      A configuração do Homebrew requer acesso SSH ao repositório privado no GitHub.
    EOS
  end

  test do
    assert_match "tokenusage start", shell_output("#{bin}/tokenusage --help")
  end
end
