TAILSCALE_IP = 100.109.197.38

.PHONY: start stop dev logs

start:
	docker compose up --build -d
	@echo ""
	@echo "  Statisfaction is running!"
	@echo ""
	@echo "  Frontend:  http://$(TAILSCALE_IP):5174"
	@echo "  Backend:   http://$(TAILSCALE_IP):8001"
	@echo "  API docs:  http://$(TAILSCALE_IP):8001/docs"
	@echo ""

stop:
	docker compose down

dev:
	docker compose -f docker-compose.dev.yml up --build
	@echo ""
	@echo "  Dev server running!"
	@echo ""
	@echo "  Frontend:  http://localhost:5174"
	@echo "  Backend:   http://localhost:8001"
	@echo "  API docs:  http://localhost:8001/docs"
	@echo ""

logs:
	docker compose logs -f
