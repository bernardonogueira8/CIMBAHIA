-- ==============================================================================
-- CIMBAHIA: SEED DE TODAS AS 28 UNIDADES / BASES REGIONAIS DE SAÚDE DA BAHIA
-- Dados cadastrais de contato zerados para preenchimento manual
-- Tabela: public.units
-- ==============================================================================

INSERT INTO public.units (id, name, macroregion, municipality, email, phone, address, active)
VALUES
  ('55d18b90-f94b-5d55-a1ea-3b0f1ac10ac5', 'BRS Brumado', 'Sudoeste', 'Brumado', '', '', '', true),
  ('8adabe96-5f65-5296-bc05-c00a25d2c6ed', 'BRS Camaçari', 'Leste', 'Camaçari', '', '', '', true),
  ('17c1746d-306c-51b5-8974-001b62202ef6', 'BRS Cruz das Almas', 'Leste', 'Cruz das Almas', '', '', '', true),
  ('22015fca-2b06-5d8a-b46d-29ecf4be9ea6', 'BRS Guanambi', 'Sudoeste', 'Guanambi', '', '', '', true),
  ('746cc470-8b28-53d7-a499-13d259eb468d', 'BRS Ibotirama', 'Oeste', 'Ibotirama', '', '', '', true),
  ('639ce607-24f8-53cb-a71b-a7e5eae6ebed', 'BRS Irecê', 'Centro Norte', 'Irecê', '', '', '', true),
  ('128d63e2-595a-596a-8ffc-b50450f435df', 'BRS Itaberaba', 'Centro Leste', 'Itaberaba', '', '', '', true),
  ('4375f28e-fb3a-519a-aaae-ede0749b0936', 'BRS Itabuna', 'Sul', 'Itabuna', '', '', '', true),
  ('d7714f81-d58a-5c31-a7ac-9cba02c951ef', 'BRS Itapetinga', 'Sudoeste', 'Itapetinga', '', '', '', true),
  ('4f47584d-c754-5cea-a8a2-e5ebc65d3efb', 'BRS Jequié', 'Sul', 'Jequié', '', '', '', true),
  ('11111111-1111-1111-1111-111111111111', 'BRS Paulo Afonso', 'Norte', 'Paulo Afonso', '', '', '', true),
  ('a91ea7da-1a62-5825-80c5-c9ca470a5b72', 'BRS Porto Seguro', 'Extremo Sul', 'Porto Seguro', '', '', '', true),
  ('4f09d39b-b2f9-5d63-a5d4-e4090435a1bb', 'BRS Ribeira do Pombal', 'Nordeste', 'Ribeira do Pombal', '', '', '', true),
  ('faef29a0-b1d1-5235-84c4-a6e37be32f85', 'BRS Santa Maria da Vitória', 'Oeste', 'Santa Maria da Vitória', '', '', '', true),
  ('9773ceac-40b0-5195-a563-5474c9373ac3', 'BRS Santo Antônio de Jesus', 'Leste', 'Santo Antônio de Jesus', '', '', '', true),
  ('5d1c611f-cdc2-5e8a-9f63-754218917dd0', 'BRS Seabra', 'Centro Leste', 'Seabra', '', '', '', true),
  ('d4fd04b8-ea1a-5261-ba9f-a7b0131da4ad', 'BRS Senhor do Bonfim', 'Norte', 'Senhor do Bonfim', '', '', '', true),
  ('a021982d-52fa-57ac-86d0-50ed5c1bdebd', 'BRS Serrinha', 'Centro Leste', 'Serrinha', '', '', '', true),
  ('80920ac4-fa42-5df0-9c82-d4739445e673', 'BRS Valença', 'Sul', 'Valença', '', '', '', true),
  ('dfa19e83-bbf0-5bcf-bceb-524f684687c0', 'NRS Alagoinhas', 'Nordeste', 'Alagoinhas', '', '', '', true),
  ('b307343b-b354-5e10-bbf9-ab994d6e60dc', 'NRS Barreiras', 'Oeste', 'Barreiras', '', '', '', true),
  ('33333333-3333-3333-3333-333333333333', 'NRS Feira de Santana', 'Centro Leste', 'Feira de Santana', '', '', '', true),
  ('b8e81bfc-ee71-5920-9f4e-9807105c851c', 'NRS Ilhéus', 'Sul', 'Ilhéus', '', '', '', true),
  ('02ad2696-ad04-562c-b029-02a76dc7b6f8', 'NRS Jacobina', 'Centro Norte', 'Jacobina', '', '', '', true),
  ('22222222-2222-2222-2222-222222222222', 'NRS Juazeiro', 'Norte', 'Juazeiro', '', '', '', true),
  ('55555555-5555-5555-5555-555555555555', 'NRS Salvador', 'Leste', 'Salvador', '', '', '', true),
  ('cf5df13a-2289-5ed5-a0df-0839f5d80606', 'NRS Teixeira de Freitas', 'Extremo Sul', 'Teixeira de Freitas', '', '', '', true),
  ('44444444-4444-4444-4444-444444444444', 'NRS Vitória da Conquista', 'Sudoeste', 'Vitória da Conquista', '', '', '', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  macroregion = EXCLUDED.macroregion,
  municipality = EXCLUDED.municipality,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  address = EXCLUDED.address,
  active = true;
