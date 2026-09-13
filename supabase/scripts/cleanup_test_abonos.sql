-- Limpieza de datos de prueba antes de lanzar a producción.
-- Borra las 3 compras de prueba (y sus registros, por cascada) y libera
-- las sillas que quedaron marcadas como "reserved" durante las pruebas.
-- Las cortesías (479–504) no se tocan.

-- 1. Borra las compras de prueba (abono_registrations se borra solo por
--    "on delete cascade" definido en la migración 007_stadium_seating.sql).
delete from public.abono_purchases
where access_token in (
  'demo-token-zipa-2026',
  'mOBRZGddfuxcNS2aBYShGqzJ',
  '0DdkD9qewAXCCJEmSGVuXbEa'
);

-- 2. Libera las sillas que quedaron "reserved" por esas pruebas.
update public.stadium_seats
set status = 'available', updated_at = now()
where seat_number in (168, 217, 218, 315);

-- 3. Verificación: no debe quedar ninguna compra de prueba ni silla
--    reservada fuera de las cortesías (479–504).
select * from public.abono_purchases;
select seat_number, zone_id, status from public.stadium_seats where status <> 'available';
